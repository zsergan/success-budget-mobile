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
  author: { user_id: 7, name: 'Zakhar', status: 'member', source: 'recorded' },
  assignment: { kind: 'member', user_id: 31, name: 'Lena', status: 'member' },
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
  it("asks for the newest five records of Home's month, in the device zone", async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: feedDto([dto]) });
    const result = await store.dispatch(
      getRecentTransactions.initiate({
        spaceId: 3,
        timeZone: 'Europe/Moscow',
        from: '2026-09-30T21:00:00.000Z',
        to: '2026-10-31T20:59:59.999Z',
      }),
    );

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/spaces/3/transactions/feed',
        baseURL: expect.stringMatching(/\/api\/v2$/),
        params: {
          from: '2026-09-30T21:00:00.000Z',
          to: '2026-10-31T20:59:59.999Z',
          time_zone: 'Europe/Moscow',
          limit: 5,
        },
      }),
    );
    expect(result.data?.items[0]).toMatchObject({ id: 'tx-1', category: { icon: 'grocery' } });
  });

  it('maps the kind, the version, the compact category, the author and the assignment', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({
      data: feedDto([{ ...dto, kind: TransactionKind.INITIAL_BALANCE, version: 3 }]),
    });

    const result = await store.dispatch(
      getRecentTransactions.initiate({
        spaceId: 3,
        timeZone: 'UTC',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      }),
    );

    expect(result.data?.items[0]).toEqual({
      id: 'tx-1',
      kind: TransactionKind.INITIAL_BALANCE,
      transactionType: TransactionType.EXPENSE,
      amount: '10.00',
      timestamp: '2026-01-01T00:00:00.000Z',
      description: null,
      version: 3,
      category: {
        id: 1,
        name: 'Food',
        transactionType: TransactionType.EXPENSE,
        icon: 'grocery',
        color: AppColor.SLATE,
        isArchived: false,
      },
      author: { userId: 7, name: 'Zakhar', status: 'member', source: 'recorded' },
      assignment: { kind: 'member', person: { userId: 31, name: 'Lena', status: 'member' } },
    });
  });

  it.each([
    ['the whole space', { kind: 'space', user_id: null, name: null, status: null }, { kind: 'space' }],
    ['nobody', { kind: 'unassigned', user_id: null, name: null, status: null }, { kind: 'unassigned' }],
    [
      'a former member',
      { kind: 'member', user_id: 31, name: 'Lena', status: 'former_member' },
      { kind: 'member', person: { userId: 31, name: 'Lena', status: 'former_member' } },
    ],
    [
      'a deleted account, still a person rather than nobody',
      { kind: 'member', user_id: null, name: null, status: 'deleted' },
      { kind: 'member', person: { userId: null, name: null, status: 'deleted' } },
    ],
  ] as const)('maps an assignment to %s', async (_name, assignment, expected) => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: { ...dto, assignment } });
    const result = await store.dispatch(getTransaction.initiate({ spaceId: 3, transactionId: 'tx-1' }));

    expect(result.data?.assignment).toEqual(expected);
  });

  it.each([
    ['recorded by a member', { user_id: 7, name: 'Zakhar', status: 'member', source: 'recorded' }],
    ['imported from wallet history', { user_id: 7, name: 'Zakhar', status: 'member', source: 'imported' }],
    ['by someone who left', { user_id: 31, name: 'Lena', status: 'former_member', source: 'recorded' }],
    ['by a deleted account', { user_id: null, name: null, status: 'deleted', source: 'recorded' }],
  ] as const)('maps an author %s', async (_name, author) => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({ data: { ...dto, author } });
    const result = await store.dispatch(getTransaction.initiate({ spaceId: 3, transactionId: 'tx-1' }));

    expect(result.data?.author).toEqual({
      userId: author.user_id,
      name: author.name,
      status: author.status,
      source: author.source,
    });
  });

  it('lists the assignees of the History filter, former members apart', async () => {
    const store = createAppStore();

    mockedRequest.mockResolvedValue({
      data: {
        members: [{ key: 'member:7', user_id: 7, name: 'Zakhar', status: 'member' }],
        former_members: [{ key: 'member:31', user_id: 31, name: 'Lena', status: 'former_member' }],
        has_deleted_members: true,
      },
    });
    const result = await store.dispatch(transactionApi.endpoints.getTransactionAssignees.initiate({ spaceId: 3 }));

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/spaces/3/transactions/assignees',
        baseURL: expect.stringMatching(/\/api\/v2$/),
      }),
    );
    expect(result.data).toEqual({
      members: [{ key: 'member:7', userId: 7, name: 'Zakhar', status: 'member' }],
      formerMembers: [{ key: 'member:31', userId: 31, name: 'Lena', status: 'former_member' }],
      hasDeletedMembers: true,
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
      assignment: 'member:31' as const,
    };
    const params = {
      from: filters.from,
      to: filters.to,
      transaction_type: TransactionType.INCOME,
      kind: TransactionKind.REGULAR,
      assignment: 'member:31',
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
      category_id: 1,
      transaction_type: TransactionType.EXPENSE,
      amount: '10',
      timestamp: '2026-01-05T10:00:00.000Z',
      assignment: { kind: 'space' as const },
    };

    mockedRequest.mockResolvedValue({ data: createTransactionResponseDto() });

    const result = await store.dispatch(createTransaction.initiate({ spaceId: 3, idempotencyKey: 'key-1', data }));

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/spaces/3/transactions',
        baseURL: expect.stringMatching(/\/api\/v2$/),
        method: 'POST',
        data,
        headers: { 'Idempotency-Key': 'key-1' },
      }),
    );
    expect(result.data).toEqual({ transaction: expect.objectContaining({ id: 'tx-1' }) });
  });

  it('sends the version it replaces as a quoted If-Match with an edit and a delete', async () => {
    const store = createAppStore();
    const arg = { spaceId: 3, transactionId: 'tx-1', version: 4, idempotencyKey: 'key-1' };
    const headers = { 'Idempotency-Key': 'key-1', 'If-Match': '"4"' };

    mockedRequest.mockResolvedValue({ data: { transaction: { ...dto, version: 5 } } });
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
    expect(edit.data).toEqual({ transaction: expect.objectContaining({ version: 5 }) });
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
    store.dispatch(
      getRecentTransactions.initiate({
        spaceId: 1,
        timeZone: 'UTC',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      }),
    );
    store.dispatch(
      getRecentTransactions.initiate({
        spaceId: 2,
        timeZone: 'UTC',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
      }),
    );
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
        baseURL: expect.stringMatching(/\/api\/v2$/),
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

  it("leaves the loaded pages alone when the space's history changes, and moves its revision on instead", async () => {
    const store = createAppStore();
    const { getTransactionsRevision } = transactionApi.endpoints;
    const revisionOf = (spaceId: number) => getTransactionsRevision.select({ spaceId })(store.getState()).data;

    mockedRequest.mockResolvedValue({
      data: feedDto([row('a')], { page_info: { next_cursor: 'c1', previous_cursor: null } }),
    });
    store.dispatch(getTransactionsFeed.initiate(arg));
    store.dispatch(getTransactionsRevision.initiate({ spaceId: 3 }));
    store.dispatch(getTransactionsRevision.initiate({ spaceId: 4 }));
    await settle(store);
    const before = [revisionOf(3), revisionOf(4)];
    mockedRequest.mockClear();

    store.dispatch(baseApi.util.invalidateTags([{ type: 'Transactions', id: 3 }]));
    await settle(store);

    expect(mockedRequest).not.toHaveBeenCalled();
    expect(revisionOf(3)).not.toBe(before[0]);
    expect(revisionOf(4)).toBe(before[1]);
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
