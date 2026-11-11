import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CreateSpaceRequest } from '@api/dto';
import { baseApi } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { IDEMPOTENCY_KEY_LIFETIME_MS } from '@shared/constants';
import { SpaceType } from '@shared/enums';
import { loginMe, logoutMe } from '../auth/thunks';
import { withProfile } from '../profile/fixtures';
import { spaceApi } from '../space/api';
import { createSpaceAndSelect } from '../space/thunks';
import { selectSpaceCreationAttempt } from './selectors';
import { restoreSpaceCreation, SPACE_MAY_EXIST_MESSAGE, SPACE_UNCONFIRMED_MESSAGE } from './thunks';

const mockedRequest = jest.fn();
let mockKeys = 0;

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => `key-${++mockKeys}` }));
jest.mock('expo-secure-store');

jest.useFakeTimers();

interface SentRequest {
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
}

type Store = ReturnType<typeof createAppStore>;

const family: CreateSpaceRequest = {
  name: 'Family',
  currency_id: 3,
  type: SpaceType.GROUP,
  invites: ['anna@example.com', 'ben@example.com'],
};
const created = { id: 41, name: 'Family', type: SpaceType.GROUP, currency: { id: 3, code: 'EUR', name: 'Euro' } };

const noAnswer = () => Promise.reject(new Error('Network Error'));
const refusal = (statusCode: number, code: string) => () =>
  Promise.reject({ response: { status: statusCode, data: { statusCode, code, message: code } } });
const answers = (data: unknown) => () => Promise.resolve({ data });

const posts = () =>
  mockedRequest.mock.calls
    .map(([{ method, url, data, headers }]: [SentRequest]) => ({ method, url, data, headers }))
    .filter(({ method }) => method === 'POST');
const postOf = (key: string, data: CreateSpaceRequest = family) => ({
  method: 'POST',
  url: '/spaces',
  data,
  headers: { 'Idempotency-Key': key },
});

const stored = async (userId = 1) =>
  JSON.parse((await AsyncStorage.getItem(`pendingSpaceCreation.v1.${userId}`)) ?? 'null');

const signIn = (userId = 1) => {
  const store = createAppStore();

  store.dispatch(loginMe.fulfilled('token', 'login', { email: 'anna@example.com', password: 'password1' }));
  withProfile(store, userId);

  return store;
};

const create = (store: Store, request = family) => store.dispatch(createSpaceAndSelect(request));

// The app starts again: a new store, signed in as the same user, reads what was left.
const restart = async (userId = 1) => {
  mockedRequest.mockClear();
  const store = signIn(userId);

  await store.dispatch(restoreSpaceCreation(userId));

  return store;
};

beforeEach(async () => {
  jest.clearAllMocks();
  mockedRequest.mockReset();
  mockKeys = 0;
  jest.setSystemTime(new Date('2026-11-03T12:00:00.000Z'));
  await AsyncStorage.clear();
});

describe('space creation', () => {
  it('stores the user, key, exact body and first send time before the request goes out', async () => {
    let storedWhenSent: unknown;
    mockedRequest.mockImplementationOnce(async () => {
      storedWhenSent = await stored();
      return { data: created };
    });

    await create(signIn());

    expect(storedWhenSent).toEqual({
      idempotencyKey: 'key-1',
      request: family,
      firstSentAt: Date.parse('2026-11-03T12:00:00.000Z'),
      status: 'sending',
    });
    expect(posts()).toEqual([postOf('key-1')]);
    expect(await stored()).toBeNull();
  });

  it('selects the created space and forgets the attempt', async () => {
    const store = signIn();
    mockedRequest.mockImplementation(answers(created));

    await create(store);

    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(selectSpaceCreationAttempt(store.getState())).toBeNull();
  });

  it('sends a creation whose answer was lost again with the same key and body', async () => {
    const store = signIn();
    mockedRequest.mockImplementationOnce(noAnswer).mockImplementationOnce(answers(created));

    await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);
    expect(await stored()).toMatchObject({ idempotencyKey: 'key-1', status: 'unknown' });

    await create(store, { ...family, invites: [...family.invites!] });

    expect(posts()).toEqual([postOf('key-1'), postOf('key-1')]);
    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(await stored()).toBeNull();
  });

  it('keeps the key through a server failure and a timeout', async () => {
    const store = signIn();
    mockedRequest
      .mockImplementationOnce(refusal(502, 'BAD_GATEWAY'))
      .mockImplementationOnce(refusal(408, 'REQUEST_TIMEOUT'))
      .mockImplementationOnce(answers(created));

    await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);
    await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);
    await create(store);

    expect(posts()).toEqual([postOf('key-1'), postOf('key-1'), postOf('key-1')]);
  });

  it('gives a changed body a key of its own', async () => {
    const store = signIn();
    const renamed = { ...family, name: 'Home' };
    mockedRequest.mockImplementationOnce(noAnswer).mockImplementationOnce(answers(created));

    await expect(create(store)).rejects.toThrow();
    await create(store, renamed);

    expect(posts()).toEqual([postOf('key-1'), postOf('key-2', renamed)]);
  });

  it('forgets a creation the server refused, so the next tap starts a new one', async () => {
    const store = signIn();
    mockedRequest
      .mockImplementationOnce(refusal(400, 'SPACE_INVITE_LIMIT_REACHED'))
      .mockImplementationOnce(answers(created));

    await expect(create(store)).rejects.toMatchObject({ code: 'SPACE_INVITE_LIMIT_REACHED' });
    expect(await stored()).toBeNull();

    await create(store);
    expect(posts()).toEqual([postOf('key-1'), postOf('key-2')]);
  });

  it('keeps an unanswered creation when a retry is refused, as the first attempt may have applied', async () => {
    const store = signIn();
    mockedRequest.mockImplementationOnce(noAnswer).mockImplementationOnce(refusal(429, 'TOO_MANY_REQUESTS'));

    await expect(create(store)).rejects.toThrow();
    await expect(create(store)).rejects.toMatchObject({ statusCode: 429 });

    expect(await stored()).toMatchObject({ idempotencyKey: 'key-1', status: 'unknown' });
  });

  it('stops using a key the server says was used with another body', async () => {
    const store = signIn();
    mockedRequest
      .mockImplementationOnce(noAnswer)
      .mockImplementationOnce(refusal(409, 'IDEMPOTENCY_KEY_REUSED'))
      .mockImplementationOnce(answers(created));

    await expect(create(store)).rejects.toThrow();
    await expect(create(store)).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    expect(await stored()).toBeNull();

    await create(store);
    expect(posts().map(({ headers }) => headers)).toEqual([
      { 'Idempotency-Key': 'key-1' },
      { 'Idempotency-Key': 'key-1' },
      { 'Idempotency-Key': 'key-2' },
    ]);
  });

  it('sends nothing when the creation cannot be stored first', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

    await expect(create(signIn())).rejects.toThrow('Could not create the space');
    expect(mockedRequest).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));
  });

  it('sends nothing before the signed-in user is known', async () => {
    const store = createAppStore();
    store.dispatch(loginMe.fulfilled('token', 'login', { email: 'anna@example.com', password: 'password1' }));

    await expect(create(store)).rejects.toThrow('Could not create the space');
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  describe('after a restart', () => {
    it('offers the unanswered creation again and sends it with its own key', async () => {
      mockedRequest.mockImplementationOnce(noAnswer);
      await expect(create(signIn())).rejects.toThrow();

      const store = await restart();

      expect(selectSpaceCreationAttempt(store.getState())).toMatchObject({
        idempotencyKey: 'key-1',
        request: family,
        status: 'unknown',
      });
      expect(mockedRequest).not.toHaveBeenCalledWith(expect.objectContaining({ method: 'POST' }));

      mockedRequest.mockImplementation(answers(created));
      await create(store);

      expect(posts()).toEqual([postOf('key-1')]);
      expect(store.getState().space.currentSpaceId).toBe(41);
    });

    it('takes a creation stored but never answered before the app closed as unknown', async () => {
      mockedRequest.mockImplementationOnce(() => new Promise(() => {}));
      void create(signIn());
      while (posts().length === 0) await Promise.resolve();

      const store = await restart();

      expect(selectSpaceCreationAttempt(store.getState())).toMatchObject({ status: 'unknown' });
    });

    it("keeps a creation to its user: another user's sign-in neither sees nor replaces it", async () => {
      mockedRequest.mockImplementationOnce(noAnswer);
      await expect(create(signIn(1))).rejects.toThrow();

      const other = await restart(2);
      mockedRequest.mockImplementation(answers(created));
      await create(other, { ...family, name: 'Other' });

      expect(posts()).toEqual([postOf('key-2', { ...family, name: 'Other' })]);
      expect(await stored(1)).toMatchObject({ idempotencyKey: 'key-1', status: 'unknown' });
    });

    it('reads storage before a submit, so a creation started before the restart is not replaced unseen', async () => {
      mockedRequest.mockImplementationOnce(noAnswer);
      await expect(create(signIn())).rejects.toThrow();

      mockedRequest.mockClear();
      const store = signIn();
      mockedRequest.mockImplementation(answers(created));
      await create(store);

      expect(posts()).toEqual([postOf('key-1')]);
    });
  });

  describe('past the key lifetime', () => {
    const leaveUnanswered = async () => {
      const store = signIn();
      mockedRequest.mockImplementationOnce(noAnswer);
      await expect(create(store)).rejects.toThrow();
      jest.setSystemTime(Date.now() + IDEMPOTENCY_KEY_LIFETIME_MS);

      return store;
    };

    it('does not send it again on its own, refreshes the spaces and leaves the call to the user', async () => {
      const store = await leaveUnanswered();
      mockedRequest.mockImplementation(answers([]));
      store.dispatch(spaceApi.endpoints.getSpaces.initiate());
      await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
      mockedRequest.mockClear();

      await expect(create(store)).rejects.toThrow(SPACE_MAY_EXIST_MESSAGE);
      await jest.runOnlyPendingTimersAsync();
      await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));

      expect(posts()).toEqual([]);
      expect(mockedRequest).toHaveBeenCalledWith(expect.objectContaining({ method: 'GET', url: '/spaces' }));
      expect(await stored()).toMatchObject({ idempotencyKey: 'key-1', status: 'expired' });
    });

    it('starts a new attempt with a new key and send time only when the user taps again', async () => {
      const store = await leaveUnanswered();
      await expect(create(store)).rejects.toThrow(SPACE_MAY_EXIST_MESSAGE);
      mockedRequest.mockClear();
      let storedWhenSent: unknown;
      mockedRequest.mockImplementationOnce(async () => {
        storedWhenSent = await stored();
        return { data: created };
      });

      await create(store);

      expect(posts()).toEqual([postOf('key-2')]);
      expect(storedWhenSent).toEqual({
        idempotencyKey: 'key-2',
        request: family,
        firstSentAt: Date.now(),
        status: 'sending',
      });
      expect(store.getState().space.currentSpaceId).toBe(41);
    });

    it('keeps the new key when the new attempt goes unanswered too', async () => {
      const store = await leaveUnanswered();
      await expect(create(store)).rejects.toThrow(SPACE_MAY_EXIST_MESSAGE);
      const startedAt = Date.now();
      mockedRequest.mockImplementationOnce(noAnswer).mockImplementationOnce(answers(created));

      await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);
      expect(await stored()).toMatchObject({ idempotencyKey: 'key-2', firstSentAt: startedAt, status: 'unknown' });

      jest.setSystemTime(Date.now() + 60_000);
      await create(store);

      expect(posts().map(({ headers }) => headers)).toEqual([
        { 'Idempotency-Key': 'key-1' },
        { 'Idempotency-Key': 'key-2' },
        { 'Idempotency-Key': 'key-2' },
      ]);
    });

    it('sends no new attempt that cannot be stored first, and keeps the warning on record', async () => {
      const store = await leaveUnanswered();
      await expect(create(store)).rejects.toThrow(SPACE_MAY_EXIST_MESSAGE);
      mockedRequest.mockClear();
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

      await expect(create(store)).rejects.toThrow('Could not create the space');

      expect(posts()).toEqual([]);
      expect(selectSpaceCreationAttempt(store.getState())).toMatchObject({
        idempotencyKey: 'key-1',
        status: 'expired',
      });
      expect(await stored()).toMatchObject({ idempotencyKey: 'key-1', status: 'expired' });
    });

    it('is restored as needing the user after a restart', async () => {
      await leaveUnanswered();

      const store = await restart();

      expect(selectSpaceCreationAttempt(store.getState())).toMatchObject({ status: 'expired' });
      expect(posts()).toEqual([]);
    });

    it('forgets a new attempt the server refuses', async () => {
      const store = await leaveUnanswered();
      await expect(create(store)).rejects.toThrow(SPACE_MAY_EXIST_MESSAGE);
      mockedRequest.mockImplementationOnce(refusal(429, 'SPACE_INVITE_RATE_LIMITED'));

      await expect(create(store)).rejects.toMatchObject({ code: 'SPACE_INVITE_RATE_LIMITED' });

      expect(await stored()).toBeNull();
    });
  });

  describe('the key lifetime', () => {
    const HOUR = 60 * 60 * 1000;
    const firstSentAt = Date.parse('2026-11-03T12:00:00.000Z');
    const at = (hours: number) => jest.setSystemTime(firstSentAt + hours * HOUR);

    it('counts from the first send through repeated lost answers', async () => {
      const store = signIn();
      mockedRequest.mockImplementation(noAnswer);

      for (const hours of [0, 8, 16, 22.9]) {
        at(hours);
        await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);
        expect(await stored()).toEqual({ idempotencyKey: 'key-1', request: family, firstSentAt, status: 'unknown' });
      }

      at(23);
      await expect(create(store)).rejects.toThrow(SPACE_MAY_EXIST_MESSAGE);
      expect(posts()).toHaveLength(4);
    });

    it('keeps its original age through a restart', async () => {
      mockedRequest.mockImplementation(noAnswer);
      await expect(create(signIn())).rejects.toThrow();

      at(12);
      let store = await restart();
      expect(selectSpaceCreationAttempt(store.getState())).toMatchObject({ firstSentAt, status: 'unknown' });
      await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);

      at(23);
      store = await restart();
      expect(selectSpaceCreationAttempt(store.getState())).toMatchObject({
        idempotencyKey: 'key-1',
        status: 'expired',
      });
      mockedRequest.mockImplementation(answers(created));
      await create(store);
      expect(posts()).toEqual([postOf('key-2')]);
    });

    // A server that keeps each key for 24 hours from its first use, a replay renewing nothing, and whose answers are lost.
    it('never sends a key the server may have forgotten', async () => {
      const RETENTION_MS = 24 * HOUR;
      const keys = new Map<string, { createdAt: number; spaceId: number }>();
      const sent: { key: string; sentAt: number }[] = [];
      let spaces = 0;

      mockedRequest.mockImplementation(async ({ method, headers }: SentRequest) => {
        if (method !== 'POST') return { data: [] };

        const key = headers!['Idempotency-Key'];
        sent.push({ key, sentAt: Date.now() });
        const kept = keys.get(key);
        if (!kept || Date.now() - kept.createdAt >= RETENTION_MS) {
          keys.set(key, { createdAt: Date.now(), spaceId: ++spaces });
        }

        throw new Error('Network Error');
      });

      let store = signIn();
      for (const hours of [0, 6, 12, 18, 22.99]) {
        at(hours);
        if (hours === 12) store = await restart();
        await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);
      }

      for (const hours of [23, 24, 30]) {
        at(hours);
        store = await restart();
        expect(selectSpaceCreationAttempt(store.getState())).toMatchObject({
          idempotencyKey: 'key-1',
          status: 'expired',
        });
      }

      expect(spaces).toBe(1);
      expect(sent.every(({ key, sentAt }) => key === 'key-1' && sentAt - firstSentAt < 23 * HOUR)).toBe(true);

      // Creating it anyway is the user's own decision, under a key of its own.
      await expect(create(store)).rejects.toThrow(SPACE_UNCONFIRMED_MESSAGE);
      expect(sent.at(-1)).toEqual({ key: 'key-2', sentAt: firstSentAt + 30 * HOUR });
      expect(spaces).toBe(2);
    });
  });

  describe('a logout during the request', () => {
    const logoutWhileSending = async (
      respond: (resolve: (v: unknown) => void, reject: (r: unknown) => void) => void,
    ) => {
      const store = signIn();
      let settle!: () => void;
      mockedRequest.mockReturnValueOnce(new Promise((resolve, reject) => (settle = () => respond(resolve, reject))));

      const pending = create(store);
      while (posts().length === 0) await Promise.resolve();

      store.dispatch(logoutMe.fulfilled(undefined, 'logout', undefined));
      withProfile(store, 2);
      settle();

      await expect(pending).rejects.toBeDefined();

      return store;
    };

    it.each([
      ['an answer', (resolve: (v: unknown) => void) => resolve({ data: created })],
      ['a failure', (_: unknown, reject: (r: unknown) => void) => reject(new Error('Network Error'))],
    ])('selects nothing for the next user and leaves the creation to its own user (%s)', async (_, respond) => {
      const store = await logoutWhileSending(respond);

      expect(store.getState().space.currentSpaceId).toBeNull();
      expect(selectSpaceCreationAttempt(store.getState())).toBeNull();
      expect(await stored(2)).toBeNull();
      expect(await stored(1)).toMatchObject({ idempotencyKey: 'key-1', status: 'sending' });

      const again = await restart(1);
      expect(selectSpaceCreationAttempt(again.getState())).toMatchObject({
        idempotencyKey: 'key-1',
        status: 'unknown',
      });
    });
  });
});
