import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import type { TransactionFeedPage, TransactionsFeedArg } from '@redux/state/transaction/api';
import { feedSelection, periodArg, recentArg, transactionApi } from '@redux/state/transaction/api';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { selectIsDeleting, selectTransactionFlow } from './selectors';
import { detailsOpened } from './slice';
import { deleteTransaction } from './thunks';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
let mockKeys = 0;
jest.mock('expo-crypto', () => ({ randomUUID: () => `key-${(mockKeys += 1)}` }));
jest.mock('expo-secure-store');

jest.useFakeTimers();

const feedArg: TransactionsFeedArg = {
  selection: feedSelection(periodArg(1, { from: new Date(2026, 0, 1), to: new Date(2026, 1, 1) })),
  generation: 'g1',
};
const recent = recentArg(1);
const lunch = mapTransaction(transactionDto({ id: 'tx-1' }));
const taxi = mapTransaction(transactionDto({ id: 'tx-2' }));
const page = (items = [lunch, taxi]): TransactionFeedPage => ({
  items,
  nextCursor: null,
  previousCursor: null,
  summary: { count: items.length, income: '0.00', expense: '0.00' },
  dayTotals: [],
  sequence: 1,
});

const setUp = () => {
  const store = createAppStore();
  withProfile(store);

  store.dispatch(activateSpace(1));
  store.dispatch(
    transactionApi.util.upsertQueryEntries([
      { endpointName: 'getRecentTransactions', arg: recent, value: page() },
      { endpointName: 'getTransactionsFeed', arg: feedArg, value: { pages: [page()], pageParams: [{}] } },
    ]),
  );
  // Both screens still show their lists; their refetches after the delete never answer here.
  store.dispatch(transactionApi.endpoints.getRecentTransactions.initiate(recent));
  store.dispatch(transactionApi.endpoints.getTransactionsFeed.initiate(feedArg));

  const rows = () => {
    const home = transactionApi.endpoints.getRecentTransactions.select(recent)(store.getState()).data?.items;
    const history = transactionApi.endpoints.getTransactionsFeed.select(feedArg)(store.getState()).data?.pages[0].items;

    expect(history).toEqual(home);
    return home;
  };

  return { store, rows };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockImplementation(() => new Promise(() => {}));
});

describe('deleteTransaction', () => {
  it('keeps the row, marked as deleting, until the server answers, then drops it from the lists', async () => {
    const { store, rows } = setUp();
    let finish: (value: unknown) => void = () => {};

    mockedRequest.mockImplementation(({ method }: { method: string }) =>
      method === 'DELETE' ? new Promise((resolve) => (finish = resolve)) : new Promise(() => {}),
    );
    const pending = store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }));

    expect(selectIsDeleting(store.getState(), 'tx-1')).toBe(true);
    expect(rows()).toEqual([lunch, taxi]);
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toMatchObject({
      result: 'stale',
    });

    while (!mockedRequest.mock.calls.some(([{ method }]) => method === 'DELETE')) await Promise.resolve();
    finish({ data: true });

    expect(await pending).toEqual({ result: 'deleted', isShownInFlow: false });
    expect(selectIsDeleting(store.getState(), 'tx-1')).toBe(false);
    expect(rows()).toEqual([taxi]);
  });

  it('keeps the row when the delete gets no answer, is refused, or the record changed meanwhile', async () => {
    const { store, rows } = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toMatchObject({
      result: 'uncertain',
    });

    mockedRequest.mockRejectedValueOnce({
      response: { status: 400, data: { statusCode: 400, code: 'TRANSACTION_IS_SYSTEM', message: 'System' } },
    });
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toMatchObject({
      result: 'failed',
    });

    mockedRequest.mockRejectedValueOnce({
      response: { status: 409, data: { statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT', message: 'Conflict' } },
    });
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toMatchObject({
      result: 'conflict',
    });

    expect(rows()).toEqual([lunch, taxi]);
    expect(selectIsDeleting(store.getState(), 'tx-1')).toBe(false);
  });

  const deleteCalls = () =>
    mockedRequest.mock.calls
      .map(([config]) => config)
      .filter(({ method }) => method === 'DELETE')
      .map(({ url, headers }) => ({ url, key: headers['Idempotency-Key'], ifMatch: headers['If-Match'] }));

  it('tells a record already gone apart from one it deleted, and drops it from the lists either way', async () => {
    const { store, rows } = setUp();

    mockedRequest.mockRejectedValueOnce({
      response: { status: 404, data: { statusCode: 404, code: 'TRANSACTION_NOT_FOUND', message: 'Not found' } },
    });

    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toEqual({
      result: 'gone',
      isShownInFlow: false,
    });
    expect(rows()).toEqual([taxi]);
  });

  it('asks about a delete that got no answer again through its stored write and key, not a new one', async () => {
    const { store } = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce({ data: true });
    await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }));
    expect(store.getState().pendingWrite.writes).toHaveLength(1);

    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toMatchObject({
      result: 'deleted',
    });
    const [first, second] = deleteCalls();
    expect(second).toEqual(first);
    expect(store.getState().pendingWrite.writes).toEqual([]);
  });

  it('settles an unanswered delete with its own key before a delete of a newer version goes out', async () => {
    const { store } = setUp();

    // A refused delete refreshes the lists, so answers go by method rather than by order.
    const deleteAnswers = [
      () => Promise.reject(new Error('Network Error')),
      () =>
        Promise.reject({
          response: {
            status: 409,
            data: { statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT', message: 'Conflict' },
          },
        }),
      () => Promise.resolve({ data: true }),
    ];
    mockedRequest.mockImplementation(({ method }: { method: string }) =>
      method === 'DELETE' ? deleteAnswers.shift()!() : new Promise(() => {}),
    );
    await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }));

    const newer = { ...lunch, version: lunch.version + 1 };
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: newer }))).toMatchObject({
      result: 'deleted',
    });

    const [first, check, fresh] = deleteCalls();
    expect(check).toEqual(first);
    expect(fresh.key).not.toBe(first.key);
    expect(fresh.ifMatch).toBe(`"${newer.version}"`);
  });

  it('says whether the open sheet still waited on the delete when it was answered', async () => {
    const { store } = setUp();
    store.dispatch(detailsOpened({ spaceId: 1, transaction: lunch }));

    mockedRequest.mockRejectedValueOnce({
      response: { status: 400, data: { statusCode: 400, code: 'TRANSACTION_IS_SYSTEM', message: 'System' } },
    });
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toEqual({
      result: 'failed',
      isShownInFlow: true,
    });
    expect(selectTransactionFlow(store.getState())?.notice).toBe('deleteFailed');

    mockedRequest.mockRejectedValueOnce({
      response: { status: 400, data: { statusCode: 400, code: 'TRANSACTION_IS_SYSTEM', message: 'System' } },
    });
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: taxi }))).toEqual({
      result: 'failed',
      isShownInFlow: false,
    });
  });
});
