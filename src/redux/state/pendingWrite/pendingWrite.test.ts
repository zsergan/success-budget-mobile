import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreateTransactionRequest } from '@api/dto';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { logoutMe } from '@redux/state/auth/thunks';
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
  assignment: { kind: 'space' },
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
  Promise.reject({ response: { status: statusCode, data: { statusCode, code, message: code } } });
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
  JSON.parse((await AsyncStorage.getItem(`pendingTransactionWrites.v2.${userId}`)) ?? '{"writes":[]}').writes;

const signIn = (userId = 1) => {
  const store = createAppStore();

  withProfile(store, userId);
  store.dispatch(activateSpace(1));

  return store;
};

const submit = (
  store: ReturnType<typeof signIn>,
  request: TransactionRequest = create,
  memory: OperationMemory | null = null,
) => store.dispatch(submitTransactionRequest(request, memory));

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
  it('does not send an old user’s write if the session ends while it is being stored', async () => {
    const store = signIn(1);
    const setItem = AsyncStorage.setItem.bind(AsyncStorage);
    let release!: () => void;
    let entered!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const storing = new Promise<void>((resolve) => {
      entered = resolve;
    });
    jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(async (key, value) => {
      await setItem(key, value);
      entered();
      await blocked;
    });
    mockedRequest.mockImplementation(answers(createTransactionResponseDto()));

    const submission = submit(store);
    await storing;
    store.dispatch(logoutMe.fulfilled(undefined, 'logout', undefined));
    withProfile(store, 2);
    store.dispatch(activateSpace(1));
    release();

    expect((await submission).outcome.status).toBe('stale');
    expect(posts()).toEqual([]);
    expect(await stored(1)).toHaveLength(1);
    expect(await stored(2)).toEqual([]);

    const originalUser = await restart(1);
    expect(await results(originalUser)).toMatchObject([{ kind: 'done' }]);
    expect(posts()).toHaveLength(1);
    expect(posts()[0]).toMatchObject({ data: sentLunch });
  });

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
    const store = signIn();

    // The sign-in's own write (the active space) is out of the way first.
    await jest.advanceTimersByTimeAsync(0);
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

    const { outcome } = await submit(store);

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

  it('sends a create that ran out while its form stayed open only when saved again', async () => {
    const store = signIn();
    mockedRequest.mockImplementationOnce(noAnswer);
    const first = await submit(store);
    jest.setSystemTime(Date.now() + KEY_LIFETIME_MS);
    mockedRequest.mockImplementationOnce(refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'));

    const second = await submit(store, create, first.memory);

    expect(second.outcome).toMatchObject({ status: 'failed', failure: { kind: 'expired' } });
    expect(posts()).toHaveLength(1);

    mockedRequest.mockImplementationOnce(answers(createTransactionResponseDto()));
    const third = await submit(store, create, second.memory);

    expect(third.outcome).toMatchObject({ status: 'succeeded' });
    expect(posts()).toHaveLength(2);
    expect(posts()[1]).toEqual(posts()[0]);
    expect(await stored()).toEqual([]);
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

describe('a record with an unsettled edit or delete', () => {
  const edit = (transactionId = 'tx-1', version = 3, amount = '20.00'): TransactionRequest => ({
    type: 'update',
    spaceId: 1,
    transactionId,
    version,
    data: { amount },
  });
  const remove: TransactionRequest = { type: 'delete', spaceId: 1, transactionId: 'tx-1', version: 3 };
  const mutations = () => sent().filter(({ method }) => method !== 'GET');
  const edited = answers({ transaction: transactionDto({ version: 4 }) });

  // An edit that got no answer, read back after a restart.
  const leftUnsettled = async (request = edit()) => {
    mockedRequest.mockImplementationOnce(noAnswer);
    await submit(signIn(), request);

    return restart();
  };

  it('sends nothing new while its replay is in flight, and keeps it pending when that gets no answer', async () => {
    const store = await leftUnsettled();
    let failReplay!: (error: unknown) => void;
    let replaySent!: () => void;
    const isReplaySent = new Promise<void>((resolve) => (replaySent = resolve));
    mockedRequest.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          failReplay = reject;
          replaySent();
        }),
    );

    const replay = store.dispatch(resumePendingWrites());
    await isReplaySent;
    const newEdit = submit(store, edit('tx-1', 3));
    const newDelete = submit(store, remove);
    failReplay(new Error('timeout of 20000ms exceeded'));
    await replay;

    expect((await newEdit).outcome).toMatchObject({ status: 'failed', failure: { kind: 'blocked' } });
    expect((await newDelete).outcome).toMatchObject({ status: 'failed', failure: { kind: 'blocked' } });
    expect(mutations()).toEqual([
      expect.objectContaining({ method: 'PATCH', headers: expect.objectContaining({ 'Idempotency-Key': 'key-1' }) }),
    ]);
    expect(await stored()).toMatchObject([{ status: 'unknown', operation: { idempotencyKey: 'key-1' } }]);
  });

  it('waits for the stored writes to be read back before anything is sent for the record', async () => {
    mockedRequest.mockImplementationOnce(noAnswer);
    await submit(signIn(), edit());
    mockedRequest.mockClear();
    const store = signIn();
    mockedRequest.mockImplementationOnce(noAnswer);

    const restoring = store.dispatch(restorePendingWrites(1));
    const { outcome } = await submit(store, edit('tx-1', 3));
    await restoring;

    expect(outcome).toMatchObject({ status: 'failed', failure: { kind: 'blocked' } });
    expect(mutations()).toEqual([
      expect.objectContaining({ headers: expect.objectContaining({ 'Idempotency-Key': 'key-1' }) }),
    ]);
  });

  it('lets another record be edited at once', async () => {
    const store = await leftUnsettled();
    mockedRequest.mockImplementationOnce(edited);

    expect((await submit(store, edit('tx-2', 1))).outcome).toMatchObject({ status: 'succeeded' });
    expect(mutations()).toEqual([expect.objectContaining({ method: 'PATCH', url: '/spaces/1/transactions/tx-2' })]);
    expect(await stored()).toMatchObject([{ status: 'unknown', operation: { transactionId: 'tx-1' } }]);
  });

  it('settles the earlier edit first, then sends the new one at its version for the server to compare', async () => {
    const store = await leftUnsettled();
    mockedRequest.mockImplementationOnce(edited).mockImplementationOnce(refusal(409, 'TRANSACTION_VERSION_CONFLICT'));

    const { outcome } = await submit(store, edit('tx-1', 3, '30.00'));

    expect(outcome).toMatchObject({ status: 'failed', failure: { kind: 'conflict' } });
    expect(mutations().map(({ headers }) => headers?.['Idempotency-Key'])).toEqual(['key-1', 'key-2']);
    expect(await stored()).toEqual([]);
  });

  it('finds the record gone when the earlier delete went through', async () => {
    const store = await leftUnsettled(remove);
    mockedRequest.mockImplementationOnce(answers(true)).mockImplementationOnce(refusal(404, 'TRANSACTION_NOT_FOUND'));

    const { outcome } = await submit(store, edit('tx-1', 3));

    expect(outcome).toMatchObject({ status: 'failed', failure: { kind: 'notFound' } });
    expect(mutations().map(({ method }) => method)).toEqual(['DELETE', 'PATCH']);
  });

  it('keeps one account’s unsettled edit from another account', async () => {
    await leftUnsettled();
    const other = await restart(2);
    mockedRequest.mockImplementationOnce(edited);

    expect((await submit(other, edit('tx-1', 3))).outcome).toMatchObject({ status: 'succeeded' });
    expect(mutations()).toHaveLength(1);
    expect(await stored(1)).toHaveLength(1);
  });
});

describe('writes an older build left', () => {
  const legacyKey = (userId = 1) => `pendingTransactionWrites.v1.${userId}`;
  const legacyLunch = { ...sentLunch, assignment: undefined, wallet_id: 3 };
  const convertedLunch = { ...sentLunch, assignment: { kind: 'space' } };
  const leaveLegacy = (operations: object[], userId = 1) =>
    AsyncStorage.setItem(
      legacyKey(userId),
      JSON.stringify(operations.map((operation) => ({ status: 'unknown', operation }))),
    );
  const legacyCreate = { type: 'create', spaceId: 1, idempotencyKey: 'key-1', firstSentAt: 0, data: legacyLunch };
  const statuses = (store: ReturnType<typeof signIn>) =>
    store.getState().pendingWrite.writes.map(({ status, found }) => ({ status, found: found?.id }));

  it.each([
    ['applied', operation('applied'), [{ status: 'found', found: 'tx-1' }]],
    ['deleted since', operation('deleted'), []],
    ['never applied', refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'), [{ status: 'retry', found: undefined }]],
    ['not known yet', noAnswer, [{ status: 'checking', found: undefined }]],
    ['in a space the user lost', refusal(403, 'FORBIDDEN_SPACE'), [{ status: 'accessLost', found: undefined }]],
  ])('looks a create up first and offers what it found: %s', async (_name, answer, expected) => {
    await leaveLegacy([legacyCreate]);
    const store = await restart();
    mockedRequest.mockImplementationOnce(answer);

    await store.dispatch(resumePendingWrites());

    expect(sent()).toEqual([
      expect.objectContaining({ method: 'GET', url: '/spaces/1/transactions/operations/key-1' }),
    ]);
    expect(statuses(store)).toEqual(expected);
    expect(await stored()).toHaveLength(expected.length);
  });

  it('keeps checking across a restart, sends nothing for the user to decide, and keeps the lost space', async () => {
    await leaveLegacy([legacyCreate]);
    let store = await restart();
    mockedRequest.mockImplementationOnce(noAnswer);
    await store.dispatch(resumePendingWrites());

    store = await restart();
    expect(statuses(store)).toEqual([{ status: 'checking', found: undefined }]);
    mockedRequest.mockImplementationOnce(refusal(403, 'FORBIDDEN_SPACE'));
    await store.dispatch(resumePendingWrites());

    store = await restart();
    await store.dispatch(resumePendingWrites());

    expect(posts()).toEqual([]);
    expect(store.getState().pendingWrite.writes).toMatchObject([{ status: 'accessLost', operation: { spaceId: 1 } }]);
  });

  it('sends a restored create again under its original operation, also with a changed category', async () => {
    await leaveLegacy([legacyCreate]);
    const store = await restart();
    mockedRequest.mockImplementationOnce(refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'));
    await store.dispatch(resumePendingWrites());

    mockedRequest.mockImplementationOnce(answers(createTransactionResponseDto()));
    const request: TransactionRequest = {
      type: 'create',
      spaceId: 1,
      data: { ...lunch, category_id: 2 },
      operationId: 'key-1',
    };
    const { outcome } = await submit(store, request);

    expect(outcome).toMatchObject({ status: 'succeeded' });
    expect(posts()).toEqual([
      expect.objectContaining({
        url: '/spaces/1/transactions',
        data: { ...lunch, category_id: 2, client_operation_id: 'key-1' },
        headers: { 'Idempotency-Key': 'key-1' },
      }),
    ]);
    expect(await stored()).toEqual([]);
  });

  describe('a restored create sent again', () => {
    const resend = (store: ReturnType<typeof signIn>, categoryId = 1) =>
      submit(store, { type: 'create', spaceId: 1, data: { ...lunch, category_id: categoryId }, operationId: 'key-1' });

    const readyToRetry = async () => {
      await leaveLegacy([legacyCreate]);
      const store = await restart();
      mockedRequest.mockImplementationOnce(refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'));
      await store.dispatch(resumePendingWrites());

      return store;
    };

    it.each([
      [400, 'CATEGORY_ARCHIVED'],
      [403, 'FORBIDDEN_CATEGORY'],
    ])('keeps its draft to retry when refused with %s, and saves the corrected one once', async (status, code) => {
      let store = await readyToRetry();
      mockedRequest
        .mockImplementationOnce(refusal(status, code))
        .mockImplementationOnce(refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'));

      const { outcome } = await resend(store);

      expect(outcome).toMatchObject({ status: 'failed', failure: { kind: 'validation' } });
      expect(sent().map(({ method }) => method)).toEqual(['GET', 'POST', 'GET']);
      expect(await stored()).toMatchObject([
        { status: 'retry', operation: { idempotencyKey: 'key-1', recovered: true, data: { category_id: 1 } } },
      ]);

      store = await restart();
      expect(statuses(store)).toEqual([{ status: 'retry', found: undefined }]);
      mockedRequest.mockImplementationOnce(answers(createTransactionResponseDto()));

      expect((await resend(store, 2)).outcome).toMatchObject({ status: 'succeeded' });
      expect(sent()).toEqual([
        expect.objectContaining({
          method: 'POST',
          data: { ...convertedLunch, category_id: 2 },
          headers: { 'Idempotency-Key': 'key-1' },
        }),
      ]);
      expect(await stored()).toEqual([]);
    });

    it.each([
      ['a rate limit', refusal(429, 'TOO_MANY_REQUESTS')],
      ['no answer', noAnswer],
      ['a server failure', refusal(503, 'SERVICE_UNAVAILABLE')],
    ])('keeps it after %s and looks it up before anything is sent again', async (_name, answer) => {
      let store = await readyToRetry();
      mockedRequest.mockImplementationOnce(answer);

      expect((await resend(store)).outcome).toMatchObject({ status: 'failed', failure: { kind: 'uncertain' } });
      expect(await stored()).toMatchObject([{ status: 'checking', operation: { idempotencyKey: 'key-1' } }]);

      store = await restart();
      mockedRequest.mockImplementationOnce(operation('applied'));
      await store.dispatch(resumePendingWrites());

      expect(sent()).toEqual([
        expect.objectContaining({ method: 'GET', url: '/spaces/1/transactions/operations/key-1' }),
      ]);
      expect(statuses(store)).toEqual([{ status: 'found', found: 'tx-1' }]);
    });

    it('looks it up first when saved again in the same session after no answer', async () => {
      const store = await readyToRetry();
      mockedRequest.mockImplementationOnce(noAnswer);
      await resend(store);
      mockedRequest.mockClear();
      mockedRequest
        .mockImplementationOnce(refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND'))
        .mockImplementationOnce(answers(createTransactionResponseDto()));

      expect((await resend(store)).outcome).toMatchObject({ status: 'succeeded' });
      expect(sent().map(({ method }) => method)).toEqual(['GET', 'POST']);
      expect(await stored()).toEqual([]);
    });

    it('shows the record when a refused resend had already applied, and adds nothing', async () => {
      const store = await readyToRetry();
      mockedRequest
        .mockImplementationOnce(refusal(400, 'CATEGORY_ARCHIVED'))
        .mockImplementationOnce(operation('applied'));

      expect((await resend(store)).outcome).toMatchObject({ status: 'found', transaction: { id: 'tx-1' } });
      expect(posts()).toHaveLength(1);
      expect(await stored()).toEqual([]);
    });

    it('keeps it with its space when that space is lost', async () => {
      const store = await readyToRetry();
      mockedRequest
        .mockImplementationOnce(refusal(403, 'FORBIDDEN_SPACE'))
        .mockImplementationOnce(refusal(403, 'FORBIDDEN_SPACE'));

      await resend(store);

      expect(await stored()).toMatchObject([{ status: 'accessLost', operation: { spaceId: 1 } }]);
    });

    it('is not sent when its corrected body cannot be stored first', async () => {
      const store = await readyToRetry();
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

      expect((await resend(store, 2)).outcome).toMatchObject({ status: 'failed', failure: { kind: 'notSent' } });
      expect(posts()).toEqual([]);
      expect(statuses(store)).toEqual([{ status: 'retry', found: undefined }]);
    });
  });

  it('looks a restored create up when its key went with another body, and never adds it twice', async () => {
    const store = signIn();
    mockedRequest
      .mockImplementationOnce(refusal(409, 'IDEMPOTENCY_KEY_REUSED'))
      .mockImplementationOnce(operation('applied'));

    const { outcome } = await submit(store, { ...create, operationId: 'key-1' });

    expect(outcome).toMatchObject({ status: 'found', transaction: { id: 'tx-1' } });
    expect(posts()).toHaveLength(1);
  });

  it('sends an edit and a delete again through v2 at their versions, with their own keys and no wallet', async () => {
    await leaveLegacy([
      {
        type: 'update',
        spaceId: 1,
        transactionId: 'tx-1',
        version: 3,
        idempotencyKey: 'key-2',
        firstSentAt: 0,
        data: { wallet_id: 2, amount: '20.00' },
      },
      { type: 'delete', spaceId: 1, transactionId: 'tx-2', version: 1, idempotencyKey: 'key-3', firstSentAt: 0 },
    ]);
    const store = await restart();
    mockedRequest.mockImplementation((config: SentRequest) =>
      config.method === 'PATCH' ? answers({ transaction: transactionDto({ version: 4 }) })() : answers(true)(),
    );

    expect(await results(store)).toMatchObject([{ kind: 'done' }, { kind: 'done' }]);
    expect(sent()).toEqual([
      {
        method: 'PATCH',
        url: '/spaces/1/transactions/tx-1',
        data: { amount: '20.00' },
        headers: { 'Idempotency-Key': 'key-2', 'If-Match': '"3"' },
      },
      {
        method: 'DELETE',
        url: '/spaces/1/transactions/tx-2',
        data: undefined,
        headers: { 'Idempotency-Key': 'key-3', 'If-Match': '"1"' },
      },
    ]);
  });

  it('converts them again after a restart until they are stored, and never doubles one', async () => {
    await leaveLegacy([legacyCreate]);
    const checking = [{ status: 'checking', found: undefined }];
    // The storage mock is itself a jest.fn, so its own implementation is put back rather than restored.
    const failOnce = (method: 'setItem' | 'removeItem', key: string) => {
      const mock = AsyncStorage[method] as unknown as jest.Mock<Promise<void>, string[]>;
      const original = mock.getMockImplementation()!;

      mock.mockImplementation((...args) => {
        if (args[0] !== key) return original(...args);
        mock.mockImplementation(original);

        return Promise.reject(new Error('disk full'));
      });
    };

    failOnce('setItem', 'pendingTransactionWrites.v2.1');
    expect(statuses(await restart())).toEqual(checking);
    expect(await stored()).toEqual([]);
    expect(await AsyncStorage.getItem(legacyKey())).not.toBeNull();

    failOnce('removeItem', legacyKey());
    expect(statuses(await restart())).toEqual(checking);
    expect(await AsyncStorage.getItem(legacyKey())).not.toBeNull();

    expect(statuses(await restart())).toEqual(checking);
    expect(await stored()).toHaveLength(1);
    expect(await AsyncStorage.getItem(legacyKey())).toBeNull();
  });

  it('leaves another account’s writes in their old storage for that account', async () => {
    await leaveLegacy([legacyCreate], 1);

    const other = await restart(2);
    expect(other.getState().pendingWrite.writes).toEqual([]);
    expect(await AsyncStorage.getItem(legacyKey(1))).not.toBeNull();

    const owner = await restart(1);
    expect(owner.getState().pendingWrite.writes).toMatchObject([
      { status: 'checking', operation: { data: convertedLunch } },
    ]);
    expect(await AsyncStorage.getItem(legacyKey(1))).toBeNull();
  });
});
