import * as SecureStore from 'expo-secure-store';

import { createAppStore } from '@redux/Store';
import { INVITE_LINK_ORIGIN, PENDING_INVITATION_KEY } from '@shared/constants';
import { loginMe, logoutMe } from '../auth/thunks';
import { memberApi } from '../member/api';
import { selectPendingInvitationToken } from './selectors';
import { invitationCleared, invitationOpenHandled } from './slice';
import {
  PENDING_INVITATION_LIFETIME_MS,
  receiveInvitationLink,
  restoreInvitation,
  switchAccountForInvitation,
} from './thunks';

const mockedRequest = jest.fn();
const mockSecureStore = new Map<string, string>();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockSecureStore.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockSecureStore.delete(key)),
}));

jest.useFakeTimers();

const token = (id: number) => `${id}.${'a'.repeat(43)}`;
const appLink = (id: number) => `successbudget://invite#token=${token(id)}`;

const refusal = (status: number, code: string) => () =>
  Promise.reject({ response: { status, data: { statusCode: status, code, message: code } } });

const stored = () => JSON.parse(mockSecureStore.get(PENDING_INVITATION_KEY) ?? 'null');
const flush = () => jest.advanceTimersByTimeAsync(0);

type Store = ReturnType<typeof createAppStore>;

const keep = (id: number, storedAt = Date.now()) =>
  mockSecureStore.set(PENDING_INVITATION_KEY, JSON.stringify({ token: token(id), storedAt }));

// The next read takes what storage holds now and answers only once released, as a slow read would.
const deferNextRead = () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  jest.mocked(SecureStore.getItemAsync).mockImplementationOnce(async (key: string) => {
    const value = mockSecureStore.get(key) ?? null;
    await gate;
    return value;
  });

  return () => {
    release();
    return flush();
  };
};

// The app starts again: a new store reads what storage holds.
const restart = async () => {
  const store = createAppStore();
  await store.dispatch(restoreInvitation());
  await flush();

  return store;
};

const signedIn = () => {
  const store = createAppStore();
  store.dispatch(loginMe.fulfilled('token', 'login', { email: 'anna@example.com', password: 'password1' }));
  return store;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSecureStore.clear();
  jest.setSystemTime(new Date('2026-11-03T12:00:00.000Z'));
});

describe('an invitation link', () => {
  it('is kept in secure storage as its token and when it was kept, nothing else', async () => {
    const store = createAppStore();

    expect(store.dispatch(receiveInvitationLink(appLink(87)))).toBe(true);
    await flush();

    expect(stored()).toEqual({ token: token(87), storedAt: Date.now() });
    expect(store.getState().invitation).toMatchObject({
      pending: { token: token(87), storedAt: Date.now() },
      isOpenRequested: true,
    });
  });

  it('is read from the web link of the API host', () => {
    const store = createAppStore();

    store.dispatch(receiveInvitationLink(`${INVITE_LINK_ORIGIN}/invite#token=${token(87)}`));

    expect(selectPendingInvitationToken(store.getState())).toBe(token(87));
  });

  it('ignores any other URL and keeps the invitation it has', () => {
    const store = createAppStore();
    store.dispatch(receiveInvitationLink(appLink(87)));

    expect(store.dispatch(receiveInvitationLink('successbudget://members'))).toBe(false);
    expect(store.dispatch(receiveInvitationLink('https://evil.example.com/invite#token=' + token(88)))).toBe(false);

    expect(selectPendingInvitationToken(store.getState())).toBe(token(87));
  });

  it('delivered again keeps when it was first kept', async () => {
    const store = createAppStore();
    store.dispatch(receiveInvitationLink(appLink(87)));
    const firstKept = Date.now();
    jest.setSystemTime(firstKept + 60_000);

    store.dispatch(receiveInvitationLink(appLink(87)));
    await flush();

    expect(stored()).toEqual({ token: token(87), storedAt: firstKept });
  });

  it('is replaced by another link', async () => {
    const store = createAppStore();
    store.dispatch(receiveInvitationLink(appLink(87)));

    store.dispatch(receiveInvitationLink(appLink(88)));
    await flush();

    expect(stored()).toMatchObject({ token: token(88) });
  });
});

describe('restoring the invitation after a restart', () => {
  it('asks to open the flow again', async () => {
    mockSecureStore.set(PENDING_INVITATION_KEY, JSON.stringify({ token: token(87), storedAt: Date.now() }));
    const store = createAppStore();

    await store.dispatch(restoreInvitation());

    expect(store.getState().invitation.isOpenRequested).toBe(true);
    expect(selectPendingInvitationToken(store.getState())).toBe(token(87));
  });

  it('keeps a link opened while storage was being read', async () => {
    mockSecureStore.set(PENDING_INVITATION_KEY, JSON.stringify({ token: token(87), storedAt: Date.now() }));
    const store = createAppStore();

    const restoring = store.dispatch(restoreInvitation());
    store.dispatch(receiveInvitationLink(appLink(88)));
    await restoring;
    await flush();

    expect(selectPendingInvitationToken(store.getState())).toBe(token(88));
    expect(stored()).toMatchObject({ token: token(88) });
  });

  it('drops one kept longer than any invitation stays active', async () => {
    const storedAt = Date.now() - PENDING_INVITATION_LIFETIME_MS;
    mockSecureStore.set(PENDING_INVITATION_KEY, JSON.stringify({ token: token(87), storedAt }));
    const store = createAppStore();

    await store.dispatch(restoreInvitation());

    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it('ignores what it cannot read', async () => {
    mockSecureStore.set(PENDING_INVITATION_KEY, '{not json');
    const store = createAppStore();

    await store.dispatch(restoreInvitation());

    expect(store.getState().invitation.pending).toBeNull();
  });
});

describe('a restore still reading when the intent changes', () => {
  const openedLink = (store: Store) => store.dispatch(receiveInvitationLink(appLink(88)));

  it.each([
    ['nothing loaded yet', () => {}],
    ['a newer link loaded', openedLink],
  ])('brings nothing back after an ordinary sign-out (%s)', async (_, before) => {
    keep(87);
    const store = signedIn();
    before(store);
    const release = deferNextRead();
    const restoring = store.dispatch(restoreInvitation());

    await store.dispatch(logoutMe());
    await release();
    await restoring;

    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
    expect((await restart()).getState().invitation.pending).toBeNull();
  });

  it('leaves a newer link in place', async () => {
    keep(87);
    const store = createAppStore();
    const release = deferNextRead();
    const restoring = store.dispatch(restoreInvitation());

    openedLink(store);
    await release();
    await restoring;

    expect(selectPendingInvitationToken(store.getState())).toBe(token(88));
    expect(stored()).toMatchObject({ token: token(88) });
  });

  it('does not bring the stored link back when a newer one was declined', async () => {
    keep(87);
    const store = createAppStore();
    const release = deferNextRead();
    const restoring = store.dispatch(restoreInvitation());

    openedLink(store);
    store.dispatch(invitationCleared({ token: token(88) }));
    await release();
    await restoring;

    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
    expect((await restart()).getState().invitation.pending).toBeNull();
  });

  it('does not bring back an invitation declined before it loaded', async () => {
    keep(87);
    const store = createAppStore();
    const release = deferNextRead();
    const restoring = store.dispatch(restoreInvitation());

    store.dispatch(invitationCleared({ token: token(87) }));
    await release();
    await restoring;

    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it('removes no newer link when it finds an outlived one', async () => {
    keep(87, Date.now() - PENDING_INVITATION_LIFETIME_MS);
    const store = createAppStore();
    const release = deferNextRead();
    const restoring = store.dispatch(restoreInvitation());

    openedLink(store);
    await release();
    await restoring;

    expect(stored()).toMatchObject({ token: token(88) });
  });

  it('removes no newer link opened while it removes an outlived one', async () => {
    keep(87, Date.now() - PENDING_INVITATION_LIFETIME_MS);
    const store = createAppStore();
    let finishDelete!: () => void;
    jest
      .mocked(SecureStore.deleteItemAsync)
      .mockImplementationOnce(
        (key: string) =>
          new Promise<void>((resolve) => (finishDelete = () => resolve(void mockSecureStore.delete(key)))),
      );
    const restoring = store.dispatch(restoreInvitation());
    while (!finishDelete) await Promise.resolve();

    openedLink(store);
    finishDelete();
    await restoring;
    await flush();

    expect(stored()).toMatchObject({ token: token(88) });
  });

  it.each([
    ['an account switch', (store: Store) => store.dispatch(switchAccountForInvitation())],
    ['an expired session', (store: Store) => store.dispatch(logoutMe({ reason: 'sessionExpired' }))],
    ['the flow opening', (store: Store) => store.dispatch(invitationOpenHandled())],
  ])('restores it through %s', async (_, change) => {
    keep(87);
    const store = signedIn();
    const release = deferNextRead();
    const restoring = store.dispatch(restoreInvitation());

    await change(store);
    await release();
    await restoring;

    expect(store.getState().invitation).toMatchObject({ pending: { token: token(87) }, isOpenRequested: true });
    expect(stored()).toMatchObject({ token: token(87) });
  });
});

describe('the invitation is cleared', () => {
  it('when declined', async () => {
    const store = createAppStore();
    store.dispatch(receiveInvitationLink(appLink(87)));

    store.dispatch(invitationCleared({ token: token(87) }));
    await flush();

    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it('when accepted with its token', async () => {
    const store = signedIn();
    store.dispatch(receiveInvitationLink(appLink(87)));
    mockedRequest.mockResolvedValue({ data: { id: 41 } });

    await store.dispatch(memberApi.endpoints.acceptInvite.initiate({ token: token(87) }));
    await flush();

    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it.each([
    [404, 'SPACE_INVITE_UNUSABLE'],
    [409, 'SPACE_ALREADY_MEMBER'],
  ])('when preview or accept answers %i %s', async (status, code) => {
    for (const request of ['preview', 'accept'] as const) {
      const store = signedIn();
      store.dispatch(receiveInvitationLink(appLink(87)));
      mockedRequest.mockImplementationOnce(refusal(status, code));

      await (request === 'preview'
        ? store.dispatch(memberApi.endpoints.previewInvite.initiate({ token: token(87) }))
        : store.dispatch(memberApi.endpoints.acceptInvite.initiate({ token: token(87) })));

      expect(store.getState().invitation.pending).toBeNull();
    }
  });

  it.each([
    [403, 'SPACE_INVITE_EMAIL_MISMATCH'],
    [400, 'SPACE_MEMBER_LIMIT_REACHED'],
    [500, 'INTERNAL_SERVER_ERROR'],
  ])('not when accept answers %i %s', async (status, code) => {
    const store = signedIn();
    store.dispatch(receiveInvitationLink(appLink(87)));
    mockedRequest.mockImplementationOnce(refusal(status, code));

    await store.dispatch(memberApi.endpoints.acceptInvite.initiate({ token: token(87) }));

    expect(selectPendingInvitationToken(store.getState())).toBe(token(87));
  });

  it('not by an answer for an older link that arrives after a newer one', async () => {
    const store = signedIn();
    store.dispatch(receiveInvitationLink(appLink(87)));
    let answerOld: () => void = () => {};
    mockedRequest.mockReturnValueOnce(
      new Promise((_, reject) => (answerOld = () => refusal(404, 'SPACE_INVITE_UNUSABLE')().catch(reject))),
    );
    const preview = store.dispatch(memberApi.endpoints.previewInvite.initiate({ token: token(87) }));

    store.dispatch(receiveInvitationLink(appLink(88)));
    answerOld();
    await preview;

    expect(selectPendingInvitationToken(store.getState())).toBe(token(88));
  });

  it('not by a join with an older link that succeeds after a newer one', async () => {
    const store = signedIn();
    store.dispatch(receiveInvitationLink(appLink(87)));
    let answerOld: () => void = () => {};
    mockedRequest.mockReturnValueOnce(new Promise((resolve) => (answerOld = () => resolve({ data: { id: 41 } }))));
    const accept = store.dispatch(memberApi.endpoints.acceptInvite.initiate({ token: token(87) }));

    store.dispatch(receiveInvitationLink(appLink(88)));
    answerOld();
    await accept;
    await flush();

    expect(selectPendingInvitationToken(store.getState())).toBe(token(88));
    expect(stored()).toMatchObject({ token: token(88) });
  });

  it('on an ordinary sign-out', async () => {
    const store = signedIn();
    store.dispatch(receiveInvitationLink(appLink(87)));

    await store.dispatch(logoutMe());
    await flush();

    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it('not by an answer that outlived its session', async () => {
    const store = signedIn();
    let answer: () => void = () => {};
    mockedRequest.mockReturnValueOnce(
      new Promise((_, reject) => (answer = () => refusal(404, 'SPACE_INVITE_UNUSABLE')().catch(reject))),
    );
    store.dispatch(receiveInvitationLink(appLink(87)));
    const accept = store.dispatch(memberApi.endpoints.acceptInvite.initiate({ token: token(87) }));

    await store.dispatch(switchAccountForInvitation());
    store.dispatch(loginMe.fulfilled('token-2', 'login-2', { email: 'ben@example.com', password: 'password1' }));
    answer();
    await accept;

    expect(selectPendingInvitationToken(store.getState())).toBe(token(87));
  });
});

describe('the invitation outlives', () => {
  it.each([
    ['an account switch', (store: ReturnType<typeof createAppStore>) => store.dispatch(switchAccountForInvitation())],
    [
      'an expired session',
      (store: ReturnType<typeof createAppStore>) => store.dispatch(logoutMe({ reason: 'sessionExpired' })),
    ],
  ])('%s, and opens again after the next sign-in', async (_, signOut) => {
    const store = signedIn();
    store.dispatch(receiveInvitationLink(appLink(87)));
    store.dispatch({ type: 'invitation/invitationOpenHandled' });

    await signOut(store);
    await flush();

    expect(store.getState().invitation).toMatchObject({ pending: { token: token(87) }, isOpenRequested: true });
    expect(stored()).toMatchObject({ token: token(87) });
  });
});
