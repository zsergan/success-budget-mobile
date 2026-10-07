import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreateTransactionRequest } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { createTransactionResponseDto, transactionDto } from '@redux/state/transaction/fixtures';
import type { OperationMemory, TransactionRequest } from '@redux/state/transaction/operations';
import { KEY_LIFETIME_MS, submitTransactionRequest } from '@redux/state/transaction/operations';
import { TransactionType } from '@shared/enums';
import { restorePendingWrites, resumePendingWrites, sendPendingWriteAgain } from './thunks';

const mockedRequest = jest.fn();
let mockKeys = 0;

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => `key-${++mockKeys}` }));

jest.useFakeTimers();

interface SentRequest {
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
}

const lunch: CreateTransactionRequest = {
  wallet_id: 1,
  category_id: 1,
  transaction_type: TransactionType.EXPENSE,
  amount: '10.00',
  timestamp: '2026-01-05T10:00:00.000Z',
  description: 'Lunch',
};
const sentLunch = { ...lunch, client_operation_id: 'key-1' };
const create: TransactionRequest = { type: 'create', spaceId: 1, data: lunch };

const noAnswer = () => Promise.reject(new Error('Network Error'));
const refusal = (statusCode: number, code: string) => () =>
  Promise.reject({ response: { data: { statusCode, code, message: code } } });
const answers = (data: unknown) => () => Promise.resolve({ data });
const operation = (status: 'applied' | 'deleted') =>
  answers({
    operation_id: 'key-1',
    status,
    transaction_id: 'tx-1',
    created_at: lunch.timestamp,
    deleted_at: null,
    transaction: status === 'applied' ? transactionDto({ version: 2 }) : null,
  });

const sent = () =>
  mockedRequest.mock.calls.map(([{ method, url, data, headers }]: [SentRequest]) => ({ method, url, data, headers }));
const posts = () => sent().filter(({ method }) => method === 'POST');

const stored = async (userId = 1) =>
  JSON.parse((await AsyncStorage.getItem(`pendingTransactionWrites.v1.${userId}`)) ?? '[]');

const signIn = (userId = 1) => {
  const store = createAppStore();

  withProfile(store, userId);
  store.dispatch(activateSpace(1));

  return store;
};

const submit = (store: ReturnType<typeof signIn>, request = create, memory: OperationMemory | null = null) =>
  store.dispatch(submitTransactionRequest(request, memory));

const results = async (store: ReturnType<typeof signIn>) =>
  (await store.dispatch(resumePendingWrites())).map(({ result }) => result);

// The app starts again: a new store, signed in as the same user, reads what was left.
const restart = async (userId = 1) => {
  mockedRequest.mockClear();
  const store = signIn(userId);

  await store.dispatch(restorePendingWrites(userId));

  return store;
};

beforeEach(async () => {
  jest.clearAllMocks();
  mockKeys = 0;
  jest.setSystemTime(new Date('2026-01-05T12:00:00.000Z'));
  await AsyncStorage.clear();
});

describe('pending writes', () => {
  it('stores the user, space, key, exact body and first send time before the write goes out', async () => {
    let storedWhenSent: unknown;
    mockedRequest.mockImplementationOnce(async () => {
      storedWhenSent = await stored();
      return { data: createTransactionResponseDto() };
    });

    await submit(signIn());

    expect(storedWhenSent).toEqual([
      {
        status: 'sending',
        operation: {
          type: 'create',
          spaceId: 1,
          data: sentLunch,
          idempotencyKey: 'key-1',
          firstSentAt: Date.parse('2026-01-05T12:00:00.000Z'),
        },
      },
    ]);
    expect(posts()[0]).toMatchObject({ data: sentLunch, headers: { 'Idempotency-Key': 'key-1' } });
    expect(await stored()).toEqual([]);
  });

  it('sends nothing when the write cannot be stored first', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

    const { outcome } = await submit(signIn());

    expect(outcome).toMatchObject({ status: 'failed', failure: { kind: 'notSent' } });
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('sends an unanswered create again after a restart with its own key and body, and only once', async () => {
    mockedRequest.mockImplementationOnce(noAnswer);
    await submit(signIn());
    expect(await stored()).toMatchObject([{ status: 'unknown' }]);

    const store = await restart();
    mockedRequest.mockImplementation(answers(createTransactionResponseDto()));
    await Promise.all([store.dispatch(resumePendingWrites()), store.dispatch(resumePendingWrites())]);

    expect(posts()).toEqual([expect.objectContaining({ data: sentLunch, headers: { 'Idempotency-Key': 'key-1' } })]);
    expect(await stored()).toEqual([]);
  });

  it('takes a write stored but never answered before the app closed as unknown', async () => {
    mockedRequest.mockImplementationOnce(() => new Promise(() => {}));
    void submit(signIn());
    while (!mockedRequest.mock.calls.length) await Promise.resolve();

    const store = await restart();

    expect(store.getState().pendingWrite.writes).toMatchObject([{ status: 'unknown' }]);
  });

  it('keeps writes to their user', async () => {
    mockedRequest.mockImplementationOnce(noAnswer);
    await submit(signIn(1));

    const store = await restart(2);

    expect(store.getState().pendingWrite.writes).toEqual([]);
    expect(await stored(1)).toHaveLength(1);
  });

  describe('after the key ran out', () => {
    const leaveUnanswered = async () => {
      mockedRequest.mockImplementationOnce(noAnswer);
      await submit(signIn());
      jest.setSystemTime(Date.now() + KEY_LIFETIME_MS);
      return restart();
    };

    it('looks the create up instead of sending it, and takes what it finds', async () => {
      const store = await leaveUnanswered();
      mockedRequest.mockImplementationOnce(operation('applied'));

      expect(await results(store)).toEqual([
        { kind: 'applied', transaction: expect.objectContaining({ id: 'tx-1', version: 2 }) },
      ]);
      expect(sent()).toEqual([
        expect.objectContaining({ method: 'GET', url: '/spaces/1/transactions/operations/key-1' }),
      ]);
      expect(await stored()).toEqual([]);
    });

    it('never recreates a create that applied and was deleted since', async () => {
      const store = await leaveUnanswered();
      mockedRequest.mockImplementationOnce(operation('deleted'));

      expect(await results(store)).toEqual([{ kind: 'deleted' }]);
      expect(posts()).toEqual([]);
      expect(await stored()).toEqual([]);
    });

    it('waits for the user when the server has no trace of it, then sends the same operation', async () => {
      const store = await leaveUnanswered();
      mockedRequest.mockImplementationOnce(refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'));

      expect(await results(store)).toEqual([{ kind: 'expired' }]);
      expect(await results(store)).toEqual([]);
      expect(posts()).toEqual([]);
      expect(await stored()).toMatchObject([{ status: 'expired' }]);

      mockedRequest.mockImplementationOnce(answers(createTransactionResponseDto()));
      expect(await store.dispatch(sendPendingWriteAgain('key-1'))).toMatchObject({ kind: 'done' });
      expect(posts()).toEqual([expect.objectContaining({ data: sentLunch, headers: { 'Idempotency-Key': 'key-1' } })]);
      expect(await stored()).toEqual([]);
    });
  });

  it('looks a create up when its operation id is already taken', async () => {
    const store = signIn();
    mockedRequest
      .mockImplementationOnce(refusal(409, 'TRANSACTION_OPERATION_EXISTS'))
      .mockImplementationOnce(operation('applied'));

    const { outcome } = await submit(store);

    expect(outcome).toMatchObject({ status: 'found', transaction: { id: 'tx-1' } });
  });

  it('asks what a refused resend of a create did, and trusts the refusal only when it never applied', async () => {
    mockedRequest.mockImplementationOnce(noAnswer);
    await submit(signIn());

    const store = await restart();
    mockedRequest
      .mockImplementationOnce(refusal(400, 'CATEGORY_ARCHIVED'))
      .mockImplementationOnce(refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'));

    expect(await results(store)).toEqual([
      { kind: 'refused', error: expect.objectContaining({ code: 'CATEGORY_ARCHIVED' }) },
    ]);
    expect(await stored()).toEqual([]);
  });
});
