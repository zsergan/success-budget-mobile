import { mapTransaction } from '@api/models';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { periodArg, transactionApi } from '@redux/state/transaction/api';
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

const period = periodArg(1, { from: new Date(2026, 0, 1), to: new Date(2026, 1, 1) });
const lunch = mapTransaction(transactionDto({ id: 'tx-1' }));
const taxi = mapTransaction(transactionDto({ id: 'tx-2' }));

const setUp = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));
  store.dispatch(
    transactionApi.util.upsertQueryEntries([{ endpointName: 'getTransactions', arg: period, value: [lunch, taxi] }]),
  );
  // A screen still shows the list; its refetch after the delete never answers here.
  store.dispatch(transactionApi.endpoints.getTransactions.initiate(period));

  const rows = () => transactionApi.endpoints.getTransactions.select(period)(store.getState()).data;

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

    finish({ data: true });

    expect(await pending).toBe('deleted');
    expect(selectIsDeleting(store.getState(), 'tx-1')).toBe(false);
    expect(rows()).toEqual([taxi]);
  });

  it('keeps the row when the delete fails or the record changed meanwhile', async () => {
    const { store, rows } = setUp();

    mockedRequest.mockRejectedValueOnce(new Error('Network Error'));
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toBe('failed');

    mockedRequest.mockRejectedValueOnce({
      response: { data: { statusCode: 409, code: 'TRANSACTION_VERSION_CONFLICT', message: 'Conflict' } },
    });
    expect(await store.dispatch(deleteTransaction({ spaceId: 1, transaction: lunch }))).toBe('conflict');

    expect(rows()).toEqual([lunch, taxi]);
    expect(selectIsDeleting(store.getState(), 'tx-1')).toBe(false);
  });
});
