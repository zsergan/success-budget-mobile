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
import { forgetPendingWrite } from './storage';

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

// An answer held until the test gives it, so the order of answers is the test's.
const deferred = () => {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};

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

  // Answers by method: the stored write, then the fresh read of the record, then anything new for it.
  const route = (answer: Partial<Record<'PATCH' | 'DELETE' | 'GET', (config: SentRequest) => Promise<unknown>>>) =>
    mockedRequest.mockImplementation((config: SentRequest) => {
      const handler = answer[config.method as 'PATCH' | 'DELETE' | 'GET'];
      return handler ? handler(config) : Promise.resolve({ data: null });
    });
  const record = (version: number, amount = '20.00') => answers(transactionDto({ id: 'tx-1', version, amount }));
  const reads = () => sent().filter(({ method, url }) => method === 'GET' && url === '/spaces/1/transactions/tx-1');

  it('sends only the stored edit while it runs, then hands back the record read again instead of the new edit', async () => {
    const store = await leftUnsettled();
    const replay = deferred();
    route({ PATCH: () => replay.promise, GET: record(4) });

    const resumed = store.dispatch(resumePendingWrites());
    const pending = submit(store, edit('tx-1', 3, '30.00'));
    await jest.advanceTimersByTimeAsync(0);
    expect(mutations()).toEqual([expect.objectContaining({ headers: expect.objectContaining({ 'If-Match': '"3"' }) })]);
    expect(reads()).toEqual([]);

    replay.resolve({ data: { transaction: transactionDto({ id: 'tx-1', version: 4 }) } });
    await resumed;
    const { outcome, memory } = await pending;

    expect(outcome).toMatchObject({ status: 'recovered', reconciled: true, transaction: { version: 4 } });
    expect(mutations()).toHaveLength(1);
    expect(reads()).toHaveLength(1);
    expect(await stored()).toEqual([]);

    route({ PATCH: answers({ transaction: transactionDto({ id: 'tx-1', version: 5 }) }) });
    expect((await submit(store, edit('tx-1', 4, '30.00'), memory)).outcome).toMatchObject({ status: 'succeeded' });
    expect(mutations().map(({ headers, data }) => [headers?.['If-Match'], data])).toEqual([
      ['"3"', { amount: '20.00' }],
      ['"4"', { amount: '30.00' }],
    ]);
  });

  it('takes the version from the fresh read when the record changed again after the stored edit', async () => {
    const store = await leftUnsettled();
    route({ PATCH: edited, GET: record(6, '99.00') });

    const { outcome } = await submit(store, edit('tx-1', 3, '30.00'));

    expect(outcome).toMatchObject({ status: 'recovered', transaction: { version: 6, amount: '99.00' } });
    expect(mutations()).toHaveLength(1);
  });

  it('reads the record again when the stored edit meets a newer version, and keeps the new edit unsent', async () => {
    const store = await leftUnsettled();
    route({ PATCH: refusal(409, 'TRANSACTION_VERSION_CONFLICT'), GET: record(7) });

    const { outcome } = await submit(store, edit('tx-1', 3, '30.00'));

    expect(outcome).toMatchObject({ status: 'recovered', reconciled: true, transaction: { version: 7 } });
    expect(mutations()).toHaveLength(1);
    expect(await stored()).toEqual([]);
  });

  it('sends the new edit when the stored one was refused and the record never moved on', async () => {
    const store = await leftUnsettled();
    route({ PATCH: refusal(400, 'CATEGORY_ARCHIVED') });
    mockedRequest.mockImplementationOnce(refusal(400, 'CATEGORY_ARCHIVED')).mockImplementationOnce(edited);

    expect((await submit(store, edit('tx-1', 3, '30.00'))).outcome).toMatchObject({ status: 'succeeded' });
    expect(reads()).toEqual([]);
    expect(mutations().map(({ headers }) => headers?.['If-Match'])).toEqual(['"3"', '"3"']);
  });

  it('keeps the new edit unsent, and reads the record again on the next save, when the read gets no answer', async () => {
    const store = await leftUnsettled();
    route({ PATCH: edited, GET: noAnswer });

    const first = await submit(store, edit('tx-1', 3, '30.00'));
    expect(first.outcome).toMatchObject({ status: 'failed', failure: { kind: 'unverified' } });
    expect(first.memory).toMatchObject({ recheck: 'tx-1' });

    route({ GET: record(4) });
    const second = await submit(store, edit('tx-1', 3, '30.00'), first.memory);

    expect(second.outcome).toMatchObject({ status: 'recovered', transaction: { version: 4 } });
    expect(second.memory).not.toHaveProperty('recheck');
    expect(mutations()).toHaveLength(1);
    expect(reads()).toHaveLength(2);
  });

  it('ends the edit as gone when the stored delete went through, without sending it', async () => {
    const store = await leftUnsettled(remove);
    route({ DELETE: answers(true) });

    const { outcome } = await submit(store, edit('tx-1', 3));

    expect(outcome).toMatchObject({ status: 'failed', failure: { kind: 'notFound' } });
    expect(mutations().map(({ method }) => method)).toEqual(['DELETE']);
  });

  it('finishes a delete as already gone when the stored delete went through', async () => {
    const store = await leftUnsettled(remove);
    route({ DELETE: answers(true) });

    expect((await submit(store, remove)).outcome).toEqual({ status: 'succeeded', result: null, wasGone: true });
    expect(mutations()).toHaveLength(1);
  });

  it('hands a delete the record changed by the stored edit, and deletes nothing unseen', async () => {
    const store = await leftUnsettled();
    route({ PATCH: edited, GET: record(4) });

    const { outcome } = await submit(store, remove);

    expect(outcome).toMatchObject({ status: 'recovered', transaction: { version: 4 } });
    expect(mutations().map(({ method }) => method)).toEqual(['PATCH']);
  });

  it.each([
    ['a logout', (store: ReturnType<typeof signIn>) => store.dispatch(logoutMe())],
    ['a space switch', (store: ReturnType<typeof signIn>) => store.dispatch(activateSpace(2))],
  ])('lets nothing of the read reach the context after %s', async (_name, leave) => {
    const store = await leftUnsettled();
    const read = deferred();
    route({ PATCH: edited, GET: () => read.promise });

    const pending = submit(store, edit('tx-1', 3, '30.00'));
    await jest.advanceTimersByTimeAsync(0);
    expect(reads()).toHaveLength(1);
    await leave(store);
    read.resolve({ data: transactionDto({ id: 'tx-1', version: 4 }) });

    expect((await pending).outcome).toEqual({ status: 'stale' });
    expect(mutations()).toHaveLength(1);
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

  describe('a restored create checked and saved at once', () => {
    const lookUp = '/spaces/1/transactions/operations/key-1';
    const missing = refusal(404, 'TRANSACTION_OPERATION_NOT_FOUND');
    const save = (store: ReturnType<typeof signIn>) =>
      submit(store, { type: 'create', spaceId: 1, data: lunch, operationId: 'key-1' });
    const lookups = () => sent().filter(({ url }) => url === lookUp);
    // Each lookup and each create is answered by the next held answer of its kind.
    const hold = () => {
      const checks: ReturnType<typeof deferred>[] = [];
      const creates: ReturnType<typeof deferred>[] = [];
      const next = (queue: ReturnType<typeof deferred>[]) => {
        const answer = deferred();
        queue.push(answer);
        return answer.promise;
      };
      mockedRequest.mockImplementation((config: SentRequest) =>
        config.url === lookUp
          ? next(checks)
          : config.method === 'POST'
            ? next(creates)
            : Promise.resolve({ data: null }),
      );
      return { checks, creates };
    };
    const checking = async () => {
      await leaveLegacy([legacyCreate]);
      return restart();
    };
    const turns = () => jest.advanceTimersByTimeAsync(0);

    it('waits for the check, sends once, and is checked again after a restart while unanswered', async () => {
      const store = await checking();
      const { checks, creates } = hold();

      const resumed = store.dispatch(resumePendingWrites());
      await turns();
      const saving = save(store);
      await turns();
      expect(sent()).toEqual([expect.objectContaining({ method: 'GET', url: lookUp })]);

      checks[0].reject(await missing().catch((error) => error));
      await resumed;
      await turns();

      expect(posts()).toEqual([
        expect.objectContaining({ data: convertedLunch, headers: { 'Idempotency-Key': 'key-1' } }),
      ]);
      expect(await stored()).toMatchObject([{ status: 'sending', operation: { data: convertedLunch, spaceId: 1 } }]);

      const next = await restart();
      expect(statuses(next)).toEqual([{ status: 'checking', found: undefined }]);
      mockedRequest.mockImplementation(operation('applied'));
      await next.dispatch(resumePendingWrites());

      expect(sent()).toEqual([expect.objectContaining({ method: 'GET', url: lookUp })]);
      expect(statuses(next)).toEqual([{ status: 'found', found: 'tx-1' }]);
      creates[0].reject(new Error('Network Error'));
      await saving;
    });

    it('lets no check mark it unsaved while its resend is unanswered, and sends one create for every trigger', async () => {
      const store = await checking();
      const { checks, creates } = hold();

      const firstResume = store.dispatch(resumePendingWrites());
      await turns();
      const saving = save(store);
      const secondSave = save(store);
      await turns();
      checks[0].reject(await missing().catch((error) => error));
      await turns();
      const lateResume = store.dispatch(resumePendingWrites());
      await turns();

      expect(lookups()).toHaveLength(1);
      expect(posts()).toHaveLength(1);
      expect(store.getState().pendingWrite.writes).toMatchObject([{ status: 'sending' }]);

      creates[0].reject(new Error('timeout of 20000ms exceeded'));
      expect((await saving).outcome).toMatchObject({ status: 'failed', failure: { kind: 'uncertain' } });
      expect((await secondSave).outcome).toMatchObject({ status: 'failed', failure: { kind: 'uncertain' } });
      await Promise.all([firstResume, lateResume]);

      expect(posts()).toHaveLength(1);
      expect(await stored()).toMatchObject([{ status: 'checking', operation: { idempotencyKey: 'key-1' } }]);
    });

    it('leaves nothing to retry once the resend went through', async () => {
      const store = await checking();
      const { checks, creates } = hold();

      const resumed = store.dispatch(resumePendingWrites());
      await turns();
      const saving = save(store);
      checks[0].reject(await missing().catch((error) => error));
      await resumed;
      await turns();
      const lateResume = store.dispatch(resumePendingWrites());
      creates[0].resolve({ data: createTransactionResponseDto() });

      expect((await saving).outcome).toMatchObject({ status: 'succeeded' });
      await lateResume;
      expect(lookups()).toHaveLength(1);
      expect(store.getState().pendingWrite.writes).toEqual([]);
      expect(await stored()).toEqual([]);
    });

    it.each([
      ['applied', operation('applied'), { status: 'found', transaction: { id: 'tx-1' } }],
      ['deleted since', operation('deleted'), { status: 'found', transaction: null }],
    ])('sends no create when the check finds it %s', async (_name, answer, expected) => {
      const store = await checking();
      const { checks } = hold();

      const resumed = store.dispatch(resumePendingWrites());
      await turns();
      const saving = save(store);
      checks[0].resolve(await answer());
      await resumed;

      expect((await saving).outcome).toMatchObject(expected);
      expect(posts()).toEqual([]);
    });

    it('keeps a draft discarded during the check discarded', async () => {
      const store = await checking();
      const { checks } = hold();

      const resumed = store.dispatch(resumePendingWrites());
      await turns();
      store.dispatch(forgetPendingWrite('key-1'));
      checks[0].reject(await missing().catch((error) => error));
      await resumed;
      await turns();

      expect(store.getState().pendingWrite.writes).toEqual([]);
      expect(await stored()).toEqual([]);
    });

    it('keeps it to its account through a logout and another account’s session', async () => {
      const store = await checking();
      const { checks } = hold();

      const resumed = store.dispatch(resumePendingWrites());
      await turns();
      await store.dispatch(logoutMe());
      checks[0].reject(await missing().catch((error) => error));
      await resumed;

      expect(await stored()).toMatchObject([{ status: 'checking' }]);
      const other = await restart(2);
      await other.dispatch(resumePendingWrites());
      expect(sent()).toEqual([]);
      expect(await stored(1)).toMatchObject([{ status: 'checking' }]);
    });

    it('sends nothing, and keeps it to retry, when the resend cannot be stored first', async () => {
      const store = await checking();
      const { checks } = hold();
      const setItem = AsyncStorage.setItem as unknown as jest.Mock<Promise<void>, string[]>;
      const original = setItem.getMockImplementation()!;
      setItem.mockImplementation((key, value) =>
        value.includes('"status":"sending"') ? Promise.reject(new Error('disk full')) : original(key, value),
      );

      try {
        const resumed = store.dispatch(resumePendingWrites());
        await turns();
        const saving = save(store);
        checks[0].reject(await missing().catch((error) => error));
        await resumed;

        expect((await saving).outcome).toMatchObject({ status: 'failed', failure: { kind: 'notSent' } });
      } finally {
        setItem.mockImplementation(original);
      }
      expect(posts()).toEqual([]);
      expect(statuses(store)).toEqual([{ status: 'retry', found: undefined }]);
      expect(await stored()).toMatchObject([{ status: 'retry' }]);
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
