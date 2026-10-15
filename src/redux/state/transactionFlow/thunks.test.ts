import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import type { TransactionFeedPage, TransactionsFeedArg } from '@redux/state/transaction/api';
import { feedSelection, periodArg, recentArg, transactionApi } from '@redux/state/transaction/api';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { selectIsDeleting } from './selectors';
import { deleteTransaction } from './thunks';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'key-1' }));
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
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toBe('stale');

    while (!mockedRequest.mock.calls.some(([{ method }]) => method === 'DELETE')) await Promise.resolve();
    finish({ data: true });

    expect(await pending).toBe('deleted');
    expect(selectIsDeleting(store.getState(), 'tx-1')).toBe(false);
    expect(rows()).toEqual([taxi]);
  });

  it('keeps the row when the delete gets no answer, is refused, or the record changed meanwhile', async () => {
    const { store, rows } = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toBe('uncertain');

    mockedRequest.mockRejectedValueOnce({
      response: { status: 400, data: { statusCode: 400, code: 'TRANSACTION_IS_SYSTEM', message: 'System' } },
    });
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toBe('failed');

    mockedRequest.mockRejectedValueOnce({
      response: { status: 409, data: { statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT', message: 'Conflict' } },
    });
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toBe('conflict');

    expect(rows()).toEqual([lunch, taxi]);
    expect(selectIsDeleting(store.getState(), 'tx-1')).toBe(false);
  });
});
