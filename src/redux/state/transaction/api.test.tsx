import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import { renderHook } from '@testing-library/react-native';

import type { Transaction } from '@api/dto';
import { baseApi } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { AppColor, TransactionType } from '@shared/enums';
import { transactionApi } from './api';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query batches store notifications on an animation frame, which would otherwise fire after teardown.
jest.useFakeTimers();

const dto: Transaction = {
  id: 'tx-1',
  wallet_id: 1,
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-01T00:00:00.000Z',
  description: '',
  wallet: { id: 1, wallet_name: 'Cash', design: AppColor.SLATE },
  category: {
    id: 1,
    name: 'Food',
    transaction_type: TransactionType.EXPENSE,
    icon: 'Grocery',
    color: AppColor.SLATE,
    is_active: 1,
    transaction_count: 0,
    limit: null,
    archived_at: null,
  },
};

const { getTransactions, getLatestTransaction } = transactionApi.endpoints;

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
    expect(result.data?.[0]).toMatchObject({ id: 'tx-1', walletId: 1, category: { icon: 'grocery' } });
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
