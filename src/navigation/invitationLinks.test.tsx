import 'react-native-gesture-handler/jestSetup';
import { act, fireEvent, screen } from '@testing-library/react-native';

import { verifyEmail } from '@api/auth.api';
import { logoutMe, registerMe, verifyEmailMe } from '@redux/state/auth/thunks';
import {
  button,
  family,
  held,
  invitationsShown,
  isOnWelcome,
  link,
  mockRequest,
  mockSecureStore,
  ok,
  openApp,
  personal,
  previewOf,
  receive,
  refused,
  resetInvitationWorld,
  sentTo,
  server,
  setInitialUrl,
  settle,
  signIn,
  token,
} from '@screens/AcceptInvite/invitationFixtures';
import { AUTH_TOKEN_KEY, PENDING_INVITATION_KEY } from '@shared/constants';

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
jest.mock('@api/auth.api', () => ({ ...jest.requireActual('@api/auth.api'), verifyEmail: jest.fn() }));
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));

jest.useFakeTimers();

const previewedTokens = () => sentTo('/spaces/invites/preview').map(({ data }) => data?.token);

beforeEach(() => {
  jest.clearAllMocks();
  resetInvitationWorld();
});

describe('an invitation link', () => {
  it('on a cold start opens the flow only once the session and its data have loaded', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    setInitialUrl(link(87));
    const spaces = held();
    server.reads['/spaces'] = [spaces.answer];
    server.previews[token(87)] = [previewOf('Family')];

    const store = await openApp();

    expect(store.getState().launch.phase).toBe('running');
    expect(invitationsShown()).toBe(0);
    expect(previewedTokens()).toEqual([]);

    spaces.settle(ok([personal]));
    await settle();

    expect(invitationsShown()).toBe(1);
    expect(screen.getByText('Family')).toBeTruthy();
    expect(previewedTokens()).toEqual([token(87)]);
  });

  it('while the app is running opens the flow over the screen in use', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    server.previews[token(87)] = [previewOf('Family')];
    await openApp();
    expect(invitationsShown()).toBe(0);

    await receive(link(87));

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('delivered repeatedly opens one flow', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    setInitialUrl(link(87));
    server.previews[token(87)] = [previewOf('Family')];
    await openApp();

    await receive(link(87));
    await receive(link(87));

    expect(invitationsShown()).toBe(1);
    expect(previewedTokens()).toEqual([token(87)]);
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
    setInitialUrl(link(87));
    server.previews[token(87)] = [previewOf('Family')];
    const store = await openApp();

    expect(isOnWelcome()).toBe(true);
    expect(previewedTokens()).toEqual([]);

    await signIn(store);

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('survives a registration interrupted by a restart', async () => {
    setInitialUrl(link(87));
    const before = await openApp();
    const payload = { name: 'Anna', email: 'anna@example.com', password: 'secret12', base_currency_id: 3 };
    await act(async () => {
      before.dispatch(registerMe.fulfilled({ email: payload.email }, 'register', payload));
    });
    screen.unmount();

    setInitialUrl(null);
    server.previews[token(87)] = [previewOf('Family')];
    const store = await openApp();
    expect(isOnWelcome()).toBe(true);
    jest.mocked(verifyEmail).mockResolvedValue('a-token');

    await act(async () => {
      await store.dispatch(verifyEmailMe({ email: payload.email, code: '123456' }));
    });
    await settle();

    expect(mockSecureStore.get(AUTH_TOKEN_KEY)).toBe('a-token');
    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('waits through a failed launch and opens after Try again', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    setInitialUrl(link(87));
    server.reads['/spaces'] = [refused(500, 'INTERNAL_SERVER_ERROR'), ok([personal])];
    server.previews[token(87)] = [previewOf('Family')];
    await openApp();

    expect(invitationsShown()).toBe(0);

    fireEvent.press(button('Try again'));
    await settle();

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('is kept through an account switch and opens again after signing in with the invited account', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    setInitialUrl(link(87));
    server.previews[token(87)] = [refused(403, 'SPACE_INVITE_EMAIL_MISMATCH'), previewOf('Family')];
    const store = await openApp();
    expect(screen.getByText(/sent to a different email address/)).toBeTruthy();

    fireEvent.press(button('Switch account'));
    await settle();

    expect(isOnWelcome()).toBe(true);
    expect(JSON.parse(mockSecureStore.get(PENDING_INVITATION_KEY)!)).toMatchObject({ token: token(87) });

    await signIn(store);

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it('is forgotten on an ordinary sign-out', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    setInitialUrl(link(87));
    server.previews[token(87)] = [previewOf('Family')];
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
    setInitialUrl(link(87));
    const older = held();
    server.previews[token(87)] = [older.answer];
    server.previews[token(88)] = [previewOf('Trip')];
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
    setInitialUrl(link(87));
    const join = held();
    server.previews[token(87)] = [previewOf('Family')];
    server.previews[token(88)] = [previewOf('Trip')];
    server.accepts[token(87)] = [join.answer];
    const store = await openApp();

    fireEvent.press(button('Join space'));
    await settle();
    await receive(link(88));
    join.settle(ok(family));
    await settle();

    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(store.getState().invitation.pending?.token).toBe(token(88));
    expect(invitationsShown()).toBe(1);
    expect(screen.getByText('Trip')).toBeTruthy();
  });

  it('declined with Not now closes the flow and is forgotten', async () => {
    mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
    setInitialUrl(link(87));
    server.previews[token(87)] = [previewOf('Family')];
    const store = await openApp();

    fireEvent.press(button('Not now'));
    await settle();

    expect(invitationsShown()).toBe(0);
    expect(store.getState().invitation.pending).toBeNull();
    expect(mockSecureStore.has(PENDING_INVITATION_KEY)).toBe(false);
  });
});
