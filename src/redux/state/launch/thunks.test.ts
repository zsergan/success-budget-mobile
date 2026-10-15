import NetInfo from '@react-native-community/netinfo';
import * as Font from 'expo-font';
import * as SecureStore from 'expo-secure-store';

import { login } from '@api/auth.api';
import { baseApi } from '@redux/api/baseApi';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { profileApi } from '@redux/state/profile/api';
import { selectProfileId } from '@redux/state/profile/selectors';
import { activateSpace } from '@redux/state/space/thunks';
import { walletApi } from '@redux/state/wallet/api';
import { createAppStore } from '@redux/Store';
import { LAUNCH_ATTEMPT_DEADLINE_MS, LAUNCH_RATE_LIMIT_COOLDOWN_MS, retryLaunch, runLaunch } from './thunks';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('@api/auth.api', () => ({ ...jest.requireActual('@api/auth.api'), login: jest.fn() }));
jest.mock('expo-secure-store');
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const mockedGetItemAsync = jest.mocked(SecureStore.getItemAsync);
const mockedDeleteItemAsync = jest.mocked(SecureStore.deleteItemAsync);
const mockedNetInfoFetch = jest.mocked(NetInfo.fetch);

type Answer = Promise<{ data: unknown }>;

const space = { id: 1, name: 'Home', type: 'personal', currency: { id: 1, code: 'USD', name: 'US Dollar' } };

const ok = (url: string): Answer => {
  if (url === '/users/profile') return Promise.resolve({ data: { id: 1, email: 'me@example.com', name: 'Me' } });
  if (url === '/spaces') return Promise.resolve({ data: [space] });
  if (url.endsWith('/wallets'))
    return Promise.resolve({
      data: { wallets: [], total_balance: 0, total_balance_currency: 'USD', delta_percent: 0 },
    });

  return Promise.resolve({ data: [] });
};

const httpError = (statusCode: number, headers: Record<string, string> = {}) =>
  Promise.reject({
    response: { status: statusCode, data: { statusCode, message: 'error', path: '', timestamp: '' }, headers },
  });

const answer = (override: (url: string) => Answer | undefined = () => undefined) =>
  mockedRequest.mockImplementation(({ url }: { url: string }) => override(url) ?? ok(url));

const failProfile = (failure: () => Answer) => answer((url) => (url === '/users/profile' ? failure() : undefined));

const requested = (url: string) => mockedRequest.mock.calls.filter(([config]) => config.url === url).length;

const launch = async (store = createAppStore()) => {
  await store.dispatch(runLaunch());

  return store;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetItemAsync.mockResolvedValue('a-token');
  answer();
});

it('opens Welcome with no stored token and no request, offline included', async () => {
  mockedGetItemAsync.mockResolvedValue(null);
  mockedNetInfoFetch.mockResolvedValue({ isConnected: false, isInternetReachable: false } as never);

  const store = await launch();

  expect(store.getState().launch.phase).toBe('welcome');
  expect(mockedRequest).not.toHaveBeenCalled();
  expect(mockedNetInfoFetch).not.toHaveBeenCalled();
});

it('checks the session and loads the profile, spaces and wallets before opening the app', async () => {
  const store = await launch();

  expect(store.getState().launch.phase).toBe('ready');
  expect(['/users/profile', '/spaces', '/spaces/1/wallets'].map(requested)).toEqual([1, 1, 1]);
});

it('opens the app as soon as the data is in, with no minimum display time', async () => {
  const startedAt = Date.now();
  const store = await launch();

  // The fake clock never moved: nothing waited on a timer.
  expect(store.getState().launch.phase).toBe('ready');
  expect(Date.now()).toBe(startedAt);
});

it('opens the app with an empty spaces list, without asking for wallets', async () => {
  answer((url) => (url === '/spaces' ? Promise.resolve({ data: [] }) : undefined));

  const store = await launch();

  expect(store.getState().launch.phase).toBe('ready');
  expect(mockedRequest.mock.calls.some(([config]) => config.url.endsWith('/wallets'))).toBe(false);
});

describe('a request with no response', () => {
  const networkError = () => Promise.reject({ code: 'ERR_NETWORK', message: 'Network Error' });

  it('is a lost connection only when the device confirms there is no internet, and keeps the token', async () => {
    mockedNetInfoFetch.mockResolvedValue({ type: 'wifi', isConnected: true, isInternetReachable: false } as never);
    failProfile(networkError);

    const store = await launch();

    expect(store.getState().launch).toMatchObject({ phase: 'failed', stage: 'session', failure: 'offline' });
    expect(store.getState().auth.isSignedIn).toBe(true);
    expect(mockedDeleteItemAsync).not.toHaveBeenCalled();
  });

  it('is an unreachable server while the internet is there or unconfirmed', async () => {
    mockedNetInfoFetch.mockResolvedValue({ isConnected: true, isInternetReachable: null } as never);
    failProfile(networkError);

    const store = await launch();

    expect(store.getState().launch.failure).toBe('unreachable');
  });

  it('is an unreachable server after a timeout, without asking the device', async () => {
    failProfile(() => Promise.reject({ code: 'ECONNABORTED', message: 'timeout of 20000ms exceeded' }));

    const store = await launch();

    expect(store.getState().launch.failure).toBe('unreachable');
    expect(mockedNetInfoFetch).not.toHaveBeenCalled();
  });
});

it('reports a 5xx as the server’s trouble, not the connection', async () => {
  failProfile(() => httpError(503));

  const store = await launch();

  expect(store.getState().launch.failure).toBe('server');
  expect(mockedNetInfoFetch).not.toHaveBeenCalled();
});

describe('a response without the API’s error body', () => {
  const raw =
    (status: number, data: unknown, headers: Record<string, string> = {}) =>
    () =>
      Promise.reject({ response: { status, data, headers } }) as Answer;

  it.each([
    ['a 503 proxy page', raw(503, '<html><body>503 Service Unavailable</body></html>')],
    ['a 502 with no body', raw(502, '')],
    ['a 503 with no body', raw(503, undefined)],
  ])('reports %s as the server’s trouble and keeps the session', async (_, failure) => {
    failProfile(failure);

    const store = await launch();

    expect(store.getState().launch).toMatchObject({ phase: 'failed', failure: 'server' });
    expect(store.getState().auth).toMatchObject({ isSignedIn: true, userToken: 'a-token' });
    expect(mockedNetInfoFetch).not.toHaveBeenCalled();
  });

  it('holds Try again for the Retry-After of a 429 with no body', async () => {
    failProfile(raw(429, '', { 'retry-after': '5' }));

    const store = await launch();
    const { attempt, retryAt } = store.getState().launch;

    expect(store.getState().launch.failure).toBe('rateLimited');
    expect(retryAt).toBe(Date.now() + 5000);

    store.dispatch(retryLaunch());
    expect(store.getState().launch.attempt).toBe(attempt);
  });

  it('waits until the HTTP-date of a 429 with some other JSON', async () => {
    const until = new Date(Date.now() + 45_000);

    // An HTTP-date has whole seconds only.
    until.setMilliseconds(0);
    failProfile(raw(429, { error: 'rate_limited' }, { 'retry-after': until.toUTCString() }));

    const store = await launch();

    expect(store.getState().launch).toMatchObject({ failure: 'rateLimited', retryAt: until.getTime() });
  });
});

describe('a stored token and a failed check', () => {
  const noResponse = () => Promise.reject({ code: 'ERR_NETWORK', message: 'Network Error' });
  const timeout = () => Promise.reject({ code: 'ECONNABORTED', message: 'timeout of 20000ms exceeded' });

  it.each([
    ['offline', noResponse, 'offline'],
    ['a timeout', timeout, 'unreachable'],
    ['a 5xx', () => httpError(502), 'server'],
  ] as const)('keeps the token on %s and opens the app on Try again', async (_, failure, expected) => {
    mockedNetInfoFetch.mockResolvedValue({ isConnected: false, isInternetReachable: false } as never);
    failProfile(failure);

    const store = await launch();

    expect(store.getState().launch).toMatchObject({ phase: 'failed', failure: expected });
    expect(store.getState().auth).toMatchObject({ isSignedIn: true, userToken: 'a-token' });
    expect(mockedDeleteItemAsync).not.toHaveBeenCalled();

    answer();
    store.dispatch(retryLaunch());
    await jest.runOnlyPendingTimersAsync();

    expect(store.getState().launch.phase).toBe('ready');
  });
});

it('does not sign out on a 4xx other than the session’s 401', async () => {
  answer((url) => (url === '/spaces' ? httpError(403) : undefined));

  const store = await launch();

  expect(store.getState().launch).toMatchObject({ phase: 'failed', stage: 'requiredData', failure: 'server' });
  expect(store.getState().auth.isSignedIn).toBe(true);
});

it('waits for the client to end a refused session, then opens Welcome', async () => {
  failProfile(() => httpError(401));

  const store = await launch();

  // The real client ends the session on this 401 (instance.ts); the mocked one leaves it to the test.
  expect(store.getState().launch.phase).toBe('running');

  await store.dispatch(logoutMe());

  expect(store.getState().launch.phase).toBe('welcome');
  expect(mockedDeleteItemAsync).toHaveBeenCalled();
  // The ended session's data goes with it.
  expect(selectProfileId(store.getState())).toBeUndefined();
  expect(store.getState()[baseApi.reducerPath].queries).toEqual({});
  expect(store.getState().space.currentSpaceId).toBeNull();
});

describe('a 429', () => {
  it('holds Try again for the Retry-After pause', async () => {
    failProfile(() => httpError(429, { 'retry-after': '7' }));

    const store = await launch();
    const { attempt, retryAt } = store.getState().launch;

    expect(store.getState().launch.failure).toBe('rateLimited');
    expect(retryAt).toBe(Date.now() + 7000);

    answer();
    store.dispatch(retryLaunch());
    expect(store.getState().launch.attempt).toBe(attempt);

    jest.setSystemTime(retryAt as number);
    store.dispatch(retryLaunch());
    expect(store.getState().launch.attempt).toBe(attempt + 1);
  });

  it('falls back to a default pause without Retry-After', async () => {
    failProfile(() => httpError(429));

    const store = await launch();

    expect(store.getState().launch.retryAt).toBe(Date.now() + LAUNCH_RATE_LIMIT_COOLDOWN_MS);
  });
});

it('reports an unreadable SecureStore as such, keeps the token, and reads it again on Try again', async () => {
  mockedGetItemAsync.mockRejectedValueOnce(new Error('Keystore is corrupted'));

  const store = await launch();

  expect(store.getState().launch).toMatchObject({ phase: 'failed', stage: 'storedSession', failure: 'storage' });
  expect(mockedDeleteItemAsync).not.toHaveBeenCalled();

  await store.dispatch(runLaunch());

  expect(store.getState().launch.phase).toBe('ready');
});

it('reports fonts that did not load instead of opening anything', async () => {
  jest.mocked(Font.loadAsync).mockRejectedValueOnce(new Error('missing asset'));

  const store = await launch();

  expect(store.getState().launch).toMatchObject({ phase: 'failed', stage: 'resources', failure: 'resources' });
  expect(mockedGetItemAsync).not.toHaveBeenCalled();
});

it('starts one attempt however often Try again is pressed, and repeats only what failed', async () => {
  answer((url) => (url === '/spaces' ? httpError(500) : undefined));

  const store = await launch();
  const { attempt } = store.getState().launch;

  answer();
  store.dispatch(retryLaunch());
  store.dispatch(retryLaunch());
  store.dispatch(retryLaunch());

  expect(store.getState().launch).toMatchObject({ attempt: attempt + 1, phase: 'running', failure: null });

  await jest.runOnlyPendingTimersAsync();

  expect(store.getState().launch.phase).toBe('ready');
  expect(requested('/users/profile')).toBe(1);
  expect(requested('/spaces')).toBe(2);
});

describe('the attempt deadline', () => {
  it('fails an attempt that runs too long, cancels its request and ignores the late answer', async () => {
    let settleProfile: (value: { data: unknown }) => void = () => {};
    let signal: AbortSignal | undefined;

    mockedRequest.mockImplementation((config: { url: string; signal?: AbortSignal }) => {
      if (config.url !== '/users/profile') return ok(config.url);
      signal = config.signal;

      return new Promise((resolve) => (settleProfile = resolve));
    });

    const store = createAppStore();
    const running = store.dispatch(runLaunch());

    await jest.advanceTimersByTimeAsync(LAUNCH_ATTEMPT_DEADLINE_MS);
    await running;

    expect(store.getState().launch).toMatchObject({ phase: 'failed', failure: 'unreachable' });
    expect(signal?.aborted).toBe(true);

    settleProfile({ data: { id: 1, email: 'me@example.com', name: 'Me' } });
    await jest.advanceTimersByTimeAsync(0);

    expect(store.getState().launch).toMatchObject({ phase: 'failed', failure: 'unreachable' });
  });

  it('reports fonts that never finish loading as the app’s files, not the server', async () => {
    jest.mocked(Font.loadAsync).mockReturnValueOnce(new Promise(() => {}));

    const store = createAppStore();

    store.dispatch(runLaunch());
    await jest.advanceTimersByTimeAsync(LAUNCH_ATTEMPT_DEADLINE_MS);

    expect(store.getState().launch).toMatchObject({ phase: 'failed', failure: 'resources' });
  });

  it('does not fire for an attempt that already finished', async () => {
    const store = await launch();

    await jest.advanceTimersByTimeAsync(LAUNCH_ATTEMPT_DEADLINE_MS);

    expect(store.getState().launch.phase).toBe('ready');
  });
});

it('lets nothing of an attempt cut short by a logout reach the next state', async () => {
  let failProfileLate: (reason: unknown) => void = () => {};

  mockedRequest.mockImplementation(({ url }: { url: string }) =>
    url === '/users/profile' ? new Promise((_, reject) => (failProfileLate = reject)) : ok(url),
  );

  const store = createAppStore();
  const running = store.dispatch(runLaunch());

  await jest.advanceTimersByTimeAsync(0);
  await store.dispatch(logoutMe());
  failProfileLate({ code: 'ERR_NETWORK' });
  await running;

  expect(store.getState().launch.phase).toBe('welcome');
});

it('does not treat a cancelled request as a lost connection', async () => {
  failProfile(() => Promise.reject({ __CANCEL__: true, code: 'ERR_CANCELED', message: 'canceled' }));

  const store = createAppStore();

  store.dispatch(runLaunch());
  await jest.advanceTimersByTimeAsync(0);

  expect(store.getState().launch.phase).toBe('running');
  expect(mockedNetInfoFetch).not.toHaveBeenCalled();
});

describe('a stored-session read that answers after its attempt', () => {
  let settleFirstRead: { resolve: (token: string | null) => void; reject: (error: Error) => void };

  // The first read hangs until the test settles it; every later one answers at once.
  const hangFirstRead = (laterToken: string | null) =>
    mockedGetItemAsync
      .mockImplementationOnce(() => new Promise((resolve, reject) => (settleFirstRead = { resolve, reject })))
      .mockResolvedValue(laterToken);

  const timeOutOnRead = async () => {
    const store = createAppStore();
    const running = store.dispatch(runLaunch());

    await jest.advanceTimersByTimeAsync(LAUNCH_ATTEMPT_DEADLINE_MS);
    await running;

    return store;
  };

  const retry = async (store: ReturnType<typeof createAppStore>) => {
    store.dispatch(retryLaunch());
    await jest.runOnlyPendingTimersAsync();
  };

  it('times out as a session that could not be restored, not an unreachable server', async () => {
    hangFirstRead(null);

    const store = await timeOutOnRead();

    expect(store.getState().launch).toMatchObject({ phase: 'failed', stage: 'storedSession', failure: 'storage' });
    expect(store.getState().auth.storedSession).toBe('failed');
    expect(mockedRequest).not.toHaveBeenCalled();
    expect(mockedDeleteItemAsync).not.toHaveBeenCalled();
  });

  it('cannot sign in with an old token once Try again found none', async () => {
    hangFirstRead(null);

    const store = await timeOutOnRead();

    await retry(store);

    expect(store.getState().launch.phase).toBe('welcome');

    const { auth } = store.getState();

    settleFirstRead.resolve('old-token');
    await jest.advanceTimersByTimeAsync(0);

    expect(store.getState().launch.phase).toBe('welcome');
    expect(store.getState().auth).toEqual(auth);
    expect(store.getState().auth).toMatchObject({ isSignedIn: false, userToken: null, storedSession: 'read' });
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('cannot fail a session that Try again restored', async () => {
    hangFirstRead('a-token');

    const store = await timeOutOnRead();

    await retry(store);

    expect(store.getState().launch.phase).toBe('ready');

    const { auth } = store.getState();

    settleFirstRead.reject(new Error('Keystore is corrupted'));
    await jest.advanceTimersByTimeAsync(0);

    expect(store.getState().launch.phase).toBe('ready');
    expect(store.getState().auth).toEqual(auth);
  });

  it('cannot bring back a session ended while it was reading', async () => {
    hangFirstRead(null);

    const store = createAppStore();

    store.dispatch(runLaunch());
    await jest.advanceTimersByTimeAsync(0);
    await store.dispatch(logoutMe());

    const { auth } = store.getState();

    settleFirstRead.resolve('old-token');
    await jest.advanceTimersByTimeAsync(0);

    expect(store.getState().launch.phase).toBe('welcome');
    expect(store.getState().auth).toEqual(auth);
    expect(store.getState().auth.isSignedIn).toBe(false);
  });

  it('cannot replace or end the session of a later sign-in', async () => {
    jest.mocked(login).mockResolvedValue('new-token');
    hangFirstRead(null);

    const store = await timeOutOnRead();

    await retry(store);
    await store.dispatch(loginMe({ email: 'me@example.com', password: 'secret' }));

    const { auth } = store.getState();

    for (const settle of [() => settleFirstRead.resolve('old-token'), () => settleFirstRead.resolve(null)]) {
      settle();
      await jest.advanceTimersByTimeAsync(0);

      expect(store.getState().auth).toEqual(auth);
      expect(store.getState().auth).toMatchObject({ isSignedIn: true, userToken: 'new-token' });
    }
  });
});

describe('once the app is open', () => {
  const space2 = { ...space, id: 2, type: 'group' };

  it('stays open across a space switch while the new space loads', async () => {
    answer((url) => (url === '/spaces' ? Promise.resolve({ data: [space, space2] }) : undefined));
    const store = await launch();

    answer((url) => (url === '/spaces/2/wallets' ? new Promise(() => {}) : undefined));
    store.dispatch(activateSpace(2));
    store.dispatch(walletApi.endpoints.getWallets.initiate({ spaceId: 2 }));
    await jest.advanceTimersByTimeAsync(LAUNCH_ATTEMPT_DEADLINE_MS);

    expect(store.getState().launch.phase).toBe('ready');
  });

  it('stays open through a failed background refresh of the required data', async () => {
    const store = await launch();

    answer(() => httpError(500));
    await store.dispatch(walletApi.endpoints.getWallets.initiate({ spaceId: 1 }, { forceRefetch: true }));
    await store.dispatch(profileApi.endpoints.getProfile.initiate(undefined, { forceRefetch: true }));

    expect(store.getState().launch.phase).toBe('ready');
  });
});
