import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import { renderHook } from '@testing-library/react-native';

import type { Transaction } from '@api/dto';
import { baseApi } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import { transactionApi } from './api';
import { createTransactionResponseDto } from './fixtures';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query batches store notifications on an animation frame, which would otherwise fire after teardown.
jest.useFakeTimers();

const STAMPS = { created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' };

const dto: Transaction = {
  id: 'tx-1',
  kind: TransactionKind.REGULAR,
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-01T00:00:00.000Z',
  description: null,
  version: 1,
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE, ...STAMPS },
  category: {
    id: 1,
    name: 'Food',
    transaction_type: TransactionType.EXPENSE,
    icon: 'Grocery',
    color: AppColor.SLATE,
    is_active: 1,
    is_archived: false,
    ...STAMPS,
  },
};

const {
  getTransactions,
  getLatestTransaction,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = transactionApi.endpoints;

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockResolvedValue({ data: [dto] });
});

describe('transactionApi', () => {
  it('sends the period as the ISO strings it was given and maps rows into models', async () => {
    const store = createAppStore();
    const from = '2026-01-01T00:00:00.000Z';
    const to = '2026-01-31T23:59:59.999Z';

    const result = await store.dispatch(getTransactions.initiate({ spaceId: 3, from, to }));

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/spaces/3/transactions', params: { from, to } }),
    );
    expect(result.data?.[0]).toMatchObject({ id: 'tx-1', wallet: { id: 1 }, category: { icon: 'grocery' } });
  });

  it('maps the kind, the version and the compact category, and keeps a deleted wallet as null', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({
      data: [{ ...dto, kind: TransactionKind.INITIAL_BALANCE, version: 3, wallet: null }],
    });

    const result = await store.dispatch(getTransactions.initiate({ spaceId: 3, from: 'a', to: 'b' }));

    expect(result.data?.[0]).toEqual({
      id: 'tx-1',
      kind: TransactionKind.INITIAL_BALANCE,
      transactionType: TransactionType.EXPENSE,
      amount: '10.00',
      timestamp: '2026-01-01T00:00:00.000Z',
      description: null,
      version: 3,
      wallet: null,
      category: {
        id: 1,
        name: 'Food',
        transactionType: TransactionType.EXPENSE,
        icon: 'grocery',
        color: AppColor.SLATE,
        isArchived: false,
      },
    });
  });

  it('adds only the history filters it was given, under their API names', async () => {
    const store = createAppStore();
    const from = '2026-08-31T21:00:00.000Z';
    const to = '2026-09-30T09:15:42.123Z';

    await store.dispatch(
      getTransactions.initiate({ spaceId: 3, from, to, transactionType: TransactionType.EXPENSE, walletId: 4 }),
    );

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ params: { from, to, transaction_type: TransactionType.EXPENSE, wallet_id: 4 } }),
    );
  });

  it('reads one transaction by its id', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: dto });

    const result = await store.dispatch(getTransaction.initiate({ spaceId: 3, transactionId: 'tx-1' }));

    expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/spaces/3/transactions/tx-1' }));
    expect(result.data).toMatchObject({ id: 'tx-1', version: 1 });
  });

  it('sends the action key with a create and maps its result', async () => {
    const store = createAppStore();
    const data = {
      wallet_id: 1,
      category_id: 1,
      transaction_type: TransactionType.EXPENSE,
      amount: '10',
      timestamp: '2026-01-05T10:00:00.000Z',
    };

    mockedRequest.mockResolvedValue({ data: createTransactionResponseDto() });

    const result = await store.dispatch(createTransaction.initiate({ spaceId: 3, idempotencyKey: 'key-1', data }));

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', data, headers: { 'Idempotency-Key': 'key-1' } }),
    );
    expect(result.data).toMatchObject({ transaction: { id: 'tx-1' }, wallet: { balance: 90 }, previousBalance: 100 });
  });

  it('sends the version it replaces as a quoted If-Match with an edit and a delete', async () => {
    const store = createAppStore();
    const arg = { spaceId: 3, transactionId: 'tx-1', version: 4, idempotencyKey: 'key-1' };
    const headers = { 'Idempotency-Key': 'key-1', 'If-Match': '"4"' };

    mockedRequest.mockResolvedValue({
      data: { transaction: { ...dto, version: 5 }, wallets: [{ id: 1, balance: 80, is_deleted: false }] },
    });
    const edit = await store.dispatch(updateTransaction.initiate({ ...arg, data: { description: null } }));

    mockedRequest.mockResolvedValue({ data: true });
    await store.dispatch(deleteTransaction.initiate(arg));

    expect(mockedRequest).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: '/spaces/3/transactions/tx-1',
        method: 'PATCH',
        data: { description: null },
        headers,
      }),
    );
    expect(mockedRequest).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ url: '/spaces/3/transactions/tx-1', method: 'DELETE', headers }),
    );
    expect(edit.data).toMatchObject({
      transaction: { version: 5 },
      wallets: [{ id: 1, balance: 80, isDeleted: false }],
    });
  });

  it('keeps an empty latest as null rather than an error', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: null });

    const result = await store.dispatch(getLatestTransaction.initiate({ spaceId: 3 }));

    expect(result.isSuccess).toBe(true);
    expect(result.data).toBeNull();
  });

  it('refetches only the space whose tag was invalidated', async () => {
    const store = createAppStore();

    const period = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.999Z' };

    store.dispatch(getTransactions.initiate({ spaceId: 1, ...period }));
    store.dispatch(getTransactions.initiate({ spaceId: 2, ...period }));
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    mockedRequest.mockClear();

    store.dispatch(baseApi.util.invalidateTags([{ type: 'Transactions', id: 1 }]));
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/spaces/1/transactions' }));
  });

  it('sends nothing while there is no space to ask about', () => {
    const store = createAppStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    const { result } = renderHook(() => transactionApi.useGetTransactionsQuery(skipToken), { wrapper });

    expect(result.current.isUninitialized).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
