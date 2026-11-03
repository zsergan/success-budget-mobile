import 'react-native-gesture-handler/jestSetup';
import { Linking } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ThemeProvider from '@components/ThemeProvider/ThemeProvider';
import ToastProvider from '@components/Toast/ToastProvider';
import { loginMe, logoutMe, registerMe, verifyEmailMe } from '@redux/state/auth/thunks';
import { createAppStore } from '@redux/Store';
import { AUTH_TOKEN_KEY, PENDING_INVITATION_KEY } from '@shared/constants';
import { SpaceType } from '@shared/enums';
import RootNavigator from './RootNavigator';

const mockRequest = jest.fn();
const mockSecureStore = new Map<string, string>();

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockRequest(...args) }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => void mockSecureStore.set(key, value)),
  deleteItemAsync: jest.fn(async (key: string) => void mockSecureStore.delete(key)),
}));
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));

jest.useFakeTimers();

type Answer = () => Promise<unknown>;
interface Request {
  method: string;
  url: string;
  data?: { token?: string };
}

const token = (id: number) => `${id}.${'a'.repeat(43)}`;
const link = (id: number) => `successbudget://invite#token=${token(id)}`;

const ok =
  (data: unknown): Answer =>
  () =>
    Promise.resolve({ data });
const refused =
  (status: number, code: string, extra: Record<string, unknown> = {}): Answer =>
  () =>
    Promise.reject({ response: { status, data: { statusCode: status, code, message: code, ...extra } } });

const currency = { id: 3, code: 'EUR', name: 'Euro' };
const personal = { id: 1, name: 'Personal', type: SpaceType.PERSONAL, currency, role: 'owner', member_count: 1 };
const previewOf = (name: string) => ok({ space: { name, currency }, expires_at: '2026-11-08T10:00:00.000Z' });

// Routes not listed here never answer; previews and accepts answer from per-token queues.
let previews: Record<string, Answer[]>;
let accepts: Record<string, Answer[]>;
let launchAnswers: Record<string, Answer[]>;

const route = ({ method, url, data }: Request) => {
  const queue =
    url === '/spaces/invites/preview'
      ? previews[data!.token!]
      : url === '/spaces/invites/accept'
        ? accepts[data!.token!]
        : method === 'GET'
          ? launchAnswers[url]
          : undefined;
  const next = queue && queue.length > 1 ? queue.shift() : queue?.[0];

  return next ? next() : new Promise(() => {});
};

// An answer the test settles itself, to act while the request is still running.
const held = () => {
  let settle: (answer: Answer) => void = () => {};
  const answer: Answer = () => new Promise((resolve, reject) => (settle = (next) => next().then(resolve, reject)));

  return { answer, settle: (next: Answer) => settle(next) };
};

const urlListeners = new Set<(event: { url: string }) => void>();
let initialUrl: string | null;

const settle = (ms = 1000) => act(() => jest.advanceTimersByTimeAsync(ms));

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const openApp = async () => {
  const store = createAppStore();

  render(
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={metrics}>
        <Provider store={store}>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </Provider>
      </SafeAreaProvider>
    </ThemeProvider>,
  );
  await settle();

  return store;
};

const receive = async (url: string) => {
  await act(async () => urlListeners.forEach((listener) => listener({ url })));
  await settle();
};

const signIn = async (store: ReturnType<typeof createAppStore>) => {
  await act(async () => {
    store.dispatch(loginMe.fulfilled('a-token', 'login', { email: 'anna@example.com', password: 'password1' }));
  });
  await settle();
};

const invitationsShown = () => screen.queryAllByText('You’re invited to join').length;
const isOnWelcome = () => screen.queryByText('See where the money goes') !== null;
const previewsSentFor = () =>
  mockRequest.mock.calls
    .map(([config]: [Request]) => config)
    .filter(({ url }) => url === '/spaces/invites/preview')
    .map(({ data }) => data?.token);

beforeEach(() => {
  jest.clearAllMocks();
  mockSecureStore.clear();
  previews = {};
  accepts = {};
  launchAnswers = {
    '/users/profile': [ok({ id: 7, email: 'anna@example.com', name: 'Anna' })],
    '/spaces': [ok([personal])],
    '/spaces/1/wallets': [ok({ wallets: [], total_balance: 0, total_balance_currency: 'EUR', delta_percent: 0 })],
  };
  mockRequest.mockImplementation(route);
  urlListeners.clear();
  initialUrl = null;
  jest.spyOn(Linking, 'getInitialURL').mockImplementation(async () => initialUrl);
  jest.spyOn(Linking, 'addEventListener').mockImplementation((type, listener) => {
    const onUrl = listener as (event: { url: string }) => void;
    if (type === 'url') urlListeners.add(onUrl);
    return { remove: () => urlListeners.delete(onUrl) } as unknown as ReturnType<typeof Linking.addEventListener>;
  });
});

describe('an invitation link', () => {
  it('on a cold start opens the flow only once the session and its data have loaded', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    const spaces = held();
    launchAnswers['/spaces'] = [spaces.answer];
    previews[token(87)] = [previewOf('Family')];

    const store = await openApp();

    expect(store.getState().launch.phase).toBe('running');
    expect(invitationsShown()).toBe(0);
    expect(previewsSentFor()).toEqual([]);

    spaces.settle(ok([personal]));
    await settle();

    expect(invitationsShown()).toBe(1);
    expect(screen.getByText('Family')).toBeTruthy();
    expect(previewsSentFor()).toEqual([token(87)]);
  });

  it('while the app is running opens the flow over the screen in use', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    previews[token(87)] = [previewOf('Family')];
    await openApp();
    expect(invitationsShown()).toBe(0);

    await receive(link(87));

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('delivered repeatedly opens one flow', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    previews[token(87)] = [previewOf('Family')];
    await openApp();

    await receive(link(87));
    await receive(link(87));

    expect(invitationsShown()).toBe(1);
    expect(previewsSentFor()).toEqual([token(87)]);
  });

  it('that is not an invitation changes nothing', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    await openApp();

    await receive('successbudget://invite#token=too-short');
    await receive('https://evil.example.com/invite#token=' + token(87));

    expect(invitationsShown()).toBe(0);
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it('while signed out waits on Welcome, then opens after the sign-in has loaded the app', async () => {
    initialUrl = link(87);
    previews[token(87)] = [previewOf('Family')];
    const store = await openApp();

    expect(isOnWelcome()).toBe(true);
    expect(previewsSentFor()).toEqual([]);

    await signIn(store);

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('survives a registration interrupted by a restart', async () => {
    initialUrl = link(87);
    const before = await openApp();
    const payload = { name: 'Anna', email: 'anna@example.com', password: 'secret12', base_currency_id: 3 };
    await act(async () => {
      before.dispatch(registerMe.fulfilled({ email: payload.email }, 'register', payload));
    });
    screen.unmount();

    initialUrl = null;
    previews[token(87)] = [previewOf('Family')];
    const store = await openApp();
    expect(isOnWelcome()).toBe(true);

    await act(async () => {
      store.dispatch(verifyEmailMe.fulfilled('a-token', 'verify', { email: payload.email, code: '123456' }));
    });
    await settle();

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('waits through a failed launch and opens after Try again', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    launchAnswers['/spaces'] = [refused(500, 'INTERNAL_SERVER_ERROR'), ok([personal])];
    previews[token(87)] = [previewOf('Family')];
    await openApp();

    expect(invitationsShown()).toBe(0);

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    await settle();

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('is kept through an account switch and opens again after signing in with the invited account', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    previews[token(87)] = [refused(403, 'SPACE_INVITE_EMAIL_MISMATCH'), previewOf('Family')];
    const store = await openApp();
    expect(screen.getByText(/for another account/)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Use another account' }));
    await settle();

    expect(isOnWelcome()).toBe(true);
    expect(JSON.parse(mockSecureStore.get(PENDING_INVITATION_KEY)!)).toMatchObject({ token: token(87) });

    await signIn(store);

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('is forgotten on an ordinary sign-out', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    previews[token(87)] = [previewOf('Family')];
    const store = await openApp();

    await act(async () => {
      await store.dispatch(logoutMe());
    });
    await signIn(store);

    expect(invitationsShown()).toBe(0);
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it('newer than the one being previewed takes its place, and the older answer changes nothing', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    const older = held();
    previews[token(87)] = [older.answer];
    previews[token(88)] = [previewOf('Trip')];
    const store = await openApp();

    await receive(link(88));
    older.settle(refused(404, 'SPACE_INVITE_UNUSABLE'));
    await settle();

    expect(invitationsShown()).toBe(1);
    expect(screen.getByText('Trip')).toBeTruthy();
    expect(screen.queryByText(/no longer available/)).toBeNull();
    expect(store.getState().invitation.pending?.token).toBe(token(88));
  });

  it('newer than the one being joined stays open after the older join succeeds', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    const join = held();
    previews[token(87)] = [previewOf('Family')];
    previews[token(88)] = [previewOf('Trip')];
    accepts[token(87)] = [join.answer];
    const store = await openApp();

    fireEvent.press(screen.getByRole('button', { name: 'Join' }));
    await settle();
    await receive(link(88));
    join.settle(ok({ id: 41, name: 'Family', type: SpaceType.GROUP, currency }));
    await settle();

    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(store.getState().invitation.pending?.token).toBe(token(88));
    expect(invitationsShown()).toBe(1);
    expect(screen.getByText('Trip')).toBeTruthy();
  });

  it('declined with Not now closes the flow and is forgotten', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    previews[token(87)] = [previewOf('Family')];
    const store = await openApp();

    fireEvent.press(screen.getByRole('button', { name: 'Not now' }));
    await settle();

    expect(invitationsShown()).toBe(0);
    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });

  it('joined opens the space and is forgotten', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    previews[token(87)] = [previewOf('Family')];
    accepts[token(87)] = [ok({ id: 41, name: 'Family', type: SpaceType.GROUP, currency })];
    const store = await openApp();

    fireEvent.press(screen.getByRole('button', { name: 'Join' }));
    await settle();

    expect(invitationsShown()).toBe(0);
    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(store.getState().invitation.pending).toBeNull();
  });

  it('that is no longer usable says so and is forgotten', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    initialUrl = link(87);
    previews[token(87)] = [refused(404, 'SPACE_INVITE_UNUSABLE')];
    const store = await openApp();

    expect(screen.getByText(/no longer available/)).toBeTruthy();
    expect(store.getState().invitation.pending).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await settle();
    expect(invitationsShown()).toBe(0);
  });
});
