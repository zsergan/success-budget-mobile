import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { skipToken } from '@reduxjs/toolkit/query';
import { renderHook } from '@testing-library/react-native';

import type { Transaction } from '@api/dto';
import { baseApi } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { AppColor, TransactionKind, TransactionType } from '@shared/enums';
import type { TransactionsFeedArg } from './api';
import { feedSelection, transactionApi } from './api';
import { createTransactionResponseDto, feedDto, transactionDto } from './fixtures';

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
  getRecentTransactions,
  getLatestTransaction,
  getTransaction,
  getTransactionOperation,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = transactionApi.endpoints;

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockResolvedValue({ data: [dto] });
});

describe('transactionApi', () => {
  it("asks for Home's latest records over the whole stored history, five of them, in the device zone", async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: feedDto([dto]) });
    const result = await store.dispatch(getRecentTransactions.initiate({ spaceId: 3, timeZone: 'Europe/Moscow' }));

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/spaces/3/transactions/feed',
        params: {
          from: '1970-01-01T00:00:01Z',
          to: '2038-01-19T03:14:07Z',
          time_zone: 'Europe/Moscow',
          limit: 5,
        },
      }),
    );
    expect(result.data?.items[0]).toMatchObject({ id: 'tx-1', wallet: { id: 1 }, category: { icon: 'grocery' } });
  });

  it('maps the kind, the version and the compact category, and keeps a deleted wallet as null', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({
      data: feedDto([{ ...dto, kind: TransactionKind.INITIAL_BALANCE, version: 3, wallet: null }]),
    });

    const result = await store.dispatch(getRecentTransactions.initiate({ spaceId: 3, timeZone: 'UTC' }));

    expect(result.data?.items[0]).toEqual({
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

  it('sends the filters and the search to the feed and the count alike, under their API names', async () => {
    const store = createAppStore();
    const filters = {
      spaceId: 3,
      from: '2026-08-31T21:00:00.000Z',
      to: '2026-09-30T09:15:42.123Z',
      transactionType: TransactionType.INCOME,
      kind: TransactionKind.REGULAR,
      walletId: 4,
    };
    const params = {
      from: filters.from,
      to: filters.to,
      transaction_type: TransactionType.INCOME,
      kind: TransactionKind.REGULAR,
      wallet_id: 4,
      q: 'salary',
    };

    mockedRequest.mockResolvedValueOnce({ data: feedDto([]) }).mockResolvedValueOnce({ data: { count: 0 } });
    await store.dispatch(
      transactionApi.endpoints.getTransactionsFeed.initiate({
        selection: feedSelection(filters, { q: 'salary', timeZone: 'UTC' }),
        generation: 'g1',
      }),
    );
    await store.dispatch(transactionApi.endpoints.getTransactionsCount.initiate({ ...filters, q: 'salary' }));

    expect(mockedRequest.mock.calls.map(([config]) => [config.url, config.params])).toEqual([
      ['/spaces/3/transactions/feed', { ...params, time_zone: 'UTC' }],
      ['/spaces/3/transactions/count', params],
    ]);
  });

  it('reads one transaction by its id', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: dto });

    const result = await store.dispatch(getTransaction.initiate({ spaceId: 3, transactionId: 'tx-1' }));

    expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/spaces/3/transactions/tx-1' }));
    expect(result.data).toMatchObject({ id: 'tx-1', version: 1 });
  });

  it('asks what a create did by its operation id', async () => {
    const store = createAppStore();
    const arg = { spaceId: 3, operationId: 'op-1' };
    const answer = { operation_id: 'op-1', transaction_id: 'tx-1', created_at: dto.timestamp };

    mockedRequest.mockResolvedValueOnce({
      data: { ...answer, status: 'applied', deleted_at: null, transaction: { ...dto, version: 2 } },
    });
    const applied = await store.dispatch(getTransactionOperation.initiate(arg, { subscribe: false }));

    mockedRequest.mockResolvedValueOnce({
      data: { ...answer, status: 'deleted', deleted_at: dto.timestamp, transaction: null },
    });
    const deleted = await store.dispatch(
      getTransactionOperation.initiate(arg, { subscribe: false, forceRefetch: true }),
    );

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/spaces/3/transactions/operations/op-1' }),
    );
    expect(applied.data).toMatchObject({ status: 'applied', transaction: { id: 'tx-1', version: 2 } });
    expect(deleted.data).toEqual({ status: 'deleted', transaction: null });
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

    mockedRequest.mockResolvedValue({ data: feedDto([]) });
    store.dispatch(getRecentTransactions.initiate({ spaceId: 1, timeZone: 'UTC' }));
    store.dispatch(getRecentTransactions.initiate({ spaceId: 2, timeZone: 'UTC' }));
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    mockedRequest.mockClear();

    store.dispatch(baseApi.util.invalidateTags([{ type: 'Transactions', id: 1 }]));
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));

    expect(mockedRequest).toHaveBeenCalledTimes(1);
    expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ url: '/spaces/1/transactions/feed' }));
  });

  it('sends nothing while there is no space to ask about', () => {
    const store = createAppStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

    const { result } = renderHook(() => transactionApi.useGetRecentTransactionsQuery(skipToken), { wrapper });

    expect(result.current.isUninitialized).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});

describe('getTransactionsFeed', () => {
  const { getTransactionsFeed } = transactionApi.endpoints;
  const period = { spaceId: 3, from: '2026-09-30T21:00:00.000Z', to: '2026-10-31T20:59:59.999Z' };
  const arg: TransactionsFeedArg = {
    selection: feedSelection(period, { timeZone: 'Europe/Moscow' }),
    pageSize: 2,
    generation: 'g1',
  };
  const row = (id: string) => transactionDto({ id });

  const deferred = () => {
    let resolve: (value: unknown) => void = () => undefined;
    const promise = new Promise((done) => (resolve = done));

    return { promise, resolve };
  };

  const paramsSent = () => mockedRequest.mock.calls.map(([config]) => config.params);
  const settle = (store: ReturnType<typeof createAppStore>) =>
    Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
  const selectFeed = (store: ReturnType<typeof createAppStore>, feedArg = arg) =>
    getTransactionsFeed.select(feedArg)(store.getState());

  it('asks for the first page of the selection without a cursor', async () => {
    const store = createAppStore();
    const selection = feedSelection(
      { ...period, transactionType: TransactionType.EXPENSE, kind: TransactionKind.REGULAR, categoryId: 5 },
      { q: '  coffee ', timeZone: 'Europe/Moscow' },
    );

    mockedRequest.mockResolvedValue({ data: feedDto([row('a')]) });
    await store.dispatch(getTransactionsFeed.initiate({ ...arg, selection }));

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/spaces/3/transactions/feed',
        params: {
          from: period.from,
          to: period.to,
          time_zone: 'Europe/Moscow',
          q: 'coffee',
          transaction_type: TransactionType.EXPENSE,
          kind: TransactionKind.REGULAR,
          category_id: 5,
          limit: 2,
        },
      }),
    );
  });

  it('drops a blank search, so it is the same selection as no search', () => {
    expect(feedSelection(period, { q: '   ', timeZone: 'UTC' })).toEqual(feedSelection(period, { timeZone: 'UTC' }));
  });

  it('appends older pages by next_cursor and stops when there is none', async () => {
    const store = createAppStore();

    mockedRequest
      .mockResolvedValueOnce({
        data: feedDto([row('a'), row('b')], { page_info: { next_cursor: 'c1', previous_cursor: null } }),
      })
      .mockResolvedValueOnce({
        data: feedDto([row('c')], { page_info: { next_cursor: null, previous_cursor: 'p1' } }),
      });

    await store.dispatch(getTransactionsFeed.initiate(arg));
    await store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'forward' }));
    await store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'forward' }));

    expect(paramsSent().map((params) => params.cursor)).toEqual([undefined, 'c1']);
    expect(selectFeed(store).data?.pages.map(({ items }) => items.map(({ id }) => id))).toEqual([['a', 'b'], ['c']]);
    expect(selectFeed(store).hasNextPage).toBe(false);
  });

  it('opens around a record and prepends newer pages by previous_cursor', async () => {
    const store = createAppStore();

    mockedRequest
      .mockResolvedValueOnce({
        data: feedDto([row('b'), row('c')], { page_info: { next_cursor: 'n1', previous_cursor: 'p1' } }),
      })
      .mockResolvedValueOnce({
        data: feedDto([row('a')], { page_info: { next_cursor: 'n0', previous_cursor: null } }),
      });

    await store.dispatch(getTransactionsFeed.initiate(arg, { initialPageParam: { aroundId: 'c' } }));
    await store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'backward' }));

    expect(paramsSent()[0]).toMatchObject({ around_id: 'c' });
    expect(paramsSent()[0]).not.toHaveProperty('cursor');
    expect(paramsSent()[1]).toMatchObject({ cursor: 'p1' });
    expect(selectFeed(store).data?.pages.map(({ items }) => items.map(({ id }) => id))).toEqual([['a'], ['b', 'c']]);
    expect(selectFeed(store).hasPreviousPage).toBe(false);
  });

  it('sends one request for a next page asked for twice before the first one answers', async () => {
    const store = createAppStore();
    const next = deferred();

    mockedRequest.mockResolvedValueOnce({
      data: feedDto([row('a')], { page_info: { next_cursor: 'c1', previous_cursor: null } }),
    });
    await store.dispatch(getTransactionsFeed.initiate(arg));

    mockedRequest.mockReturnValueOnce(next.promise);
    store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'forward' }));
    store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'forward' }));
    store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'backward' }));
    next.resolve({ data: feedDto([row('b')]) });
    await settle(store);

    expect(mockedRequest).toHaveBeenCalledTimes(2);
    expect(selectFeed(store).data?.pages).toHaveLength(2);
  });

  it('keeps generations of one selection in separate entries', async () => {
    const store = createAppStore();
    const other = { ...arg, generation: 'g2' };

    mockedRequest
      .mockResolvedValueOnce({ data: feedDto([row('a')]) })
      .mockResolvedValueOnce({ data: feedDto([row('b')]) });
    await store.dispatch(getTransactionsFeed.initiate(arg));
    await store.dispatch(getTransactionsFeed.initiate(other));

    expect(selectFeed(store).data?.pages[0].items[0].id).toBe('a');
    expect(selectFeed(store, other).data?.pages[0].items[0].id).toBe('b');
  });

  it("refreshes every loaded page of a generation from its first one when the space's history changes", async () => {
    const store = createAppStore();

    mockedRequest
      .mockResolvedValueOnce({ data: feedDto([row('a')], { page_info: { next_cursor: 'c1', previous_cursor: null } }) })
      .mockResolvedValueOnce({ data: feedDto([row('b')]) });
    store.dispatch(getTransactionsFeed.initiate(arg));
    await settle(store);
    await store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'forward' }));
    mockedRequest.mockClear();

    mockedRequest
      .mockResolvedValueOnce({
        data: feedDto([row('a2')], { page_info: { next_cursor: 'c2', previous_cursor: null } }),
      })
      .mockResolvedValueOnce({ data: feedDto([row('b2')]) });
    store.dispatch(baseApi.util.invalidateTags([{ type: 'Transactions', id: 3 }]));
    await settle(store);

    expect(paramsSent().map((params) => params.cursor)).toEqual([undefined, 'c2']);
    expect(selectFeed(store).data?.pages.map(({ items }) => items[0].id)).toEqual(['a2', 'b2']);
  });

  it('does not bring back an entry that was removed while its next page was loading', async () => {
    const store = createAppStore();
    const next = deferred();

    mockedRequest.mockResolvedValueOnce({
      data: feedDto([row('a')], { page_info: { next_cursor: 'c1', previous_cursor: null } }),
    });
    const subscription = store.dispatch(getTransactionsFeed.initiate(arg));
    await subscription;

    mockedRequest.mockReturnValueOnce(next.promise);
    store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'forward', subscribe: false }));
    subscription.unsubscribe();
    jest.runOnlyPendingTimers();
    next.resolve({ data: feedDto([row('b')]) });
    await settle(store);

    expect(selectFeed(store).data).toBeUndefined();
  });

  it('maps the summary and day totals as the strings the server sent', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({
      data: feedDto([row('a')], {
        summary: { count: 73, income: '98765432109876543.21', expense: '1184.45' },
        day_totals: [{ date: '2026-10-03', net: '-31.50' }],
      }),
    });
    await store.dispatch(getTransactionsFeed.initiate(arg));

    expect(selectFeed(store).data?.pages[0]).toMatchObject({
      summary: { count: 73, income: '98765432109876543.21', expense: '1184.45' },
      dayTotals: [{ date: '2026-10-03', net: '-31.50' }],
      nextCursor: null,
      previousCursor: null,
    });
  });

  it('keeps at most ten pages, dropping the far end and reading it back by cursor', async () => {
    const store = createAppStore();
    const pageAt = (n: number) => ({
      data: feedDto([row(`r${n}`)], {
        page_info: { next_cursor: `n${n + 1}`, previous_cursor: n > 0 ? `n${n - 1}` : null },
      }),
    });
    mockedRequest.mockImplementation(({ params }: { params: { cursor?: string } }) =>
      Promise.resolve(pageAt(params.cursor ? Number(params.cursor.slice(1)) : 0)),
    );

    await store.dispatch(getTransactionsFeed.initiate(arg));
    for (let page = 1; page <= 10; page += 1) {
      await store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'forward' }));
    }
    const firstIds = () => selectFeed(store).data?.pages.map(({ items }) => items[0].id);

    expect(firstIds()).toEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10']);
    expect(selectFeed(store).hasPreviousPage).toBe(true);

    await store.dispatch(getTransactionsFeed.initiate(arg, { direction: 'backward' }));

    expect(paramsSent().at(-1)).toMatchObject({ cursor: 'n0' });
    expect(firstIds()).toEqual(['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9']);
  });
});
