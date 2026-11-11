import 'react-native-gesture-handler/jestSetup';
import { act, fireEvent, screen } from '@testing-library/react-native';

import { logoutMe } from '@redux/state/auth/thunks';
import { AUTH_TOKEN_KEY, PENDING_INVITATION_KEY } from '@shared/constants';
import {
  button,
  codeFormsShown,
  family,
  held,
  invitationsShown,
  isOnHome,
  isOnWelcome,
  link,
  lost,
  mockRequest,
  mockSecureStore,
  ok,
  openApp,
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
} from './invitationFixtures';

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

const accepts = () => sentTo('/spaces/invites/accept').map(({ data }) => data);
const spacesReads = () => sentTo('/spaces').filter(({ method }) => method === 'GET').length;

const press = async (name: string | RegExp) => {
  fireEvent.press(button(name));
  await settle();
};

// Signed in, with the link of invitation 87 opened from an email.
const openLink = async () => {
  mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
  setInitialUrl(link(87));

  return openApp();
};

// Signed in, on the code form reached from Settings.
const openCodeForm = async () => {
  mockSecureStore.set(AUTH_TOKEN_KEY, 'a-token');
  const store = await openApp();
  fireEvent.press(screen.getByText('Profile'));
  await settle();
  fireEvent.press(screen.getByText('Join a space'));
  await settle();

  return store;
};

const enterCode = async (code: string) => {
  fireEvent.changeText(screen.getByLabelText('Invite code'), code);
  await settle();
  await press('Join space');
};

beforeEach(() => {
  jest.clearAllMocks();
  resetInvitationWorld();
});

describe('joining from a link', () => {
  it('shows the space, its currency and when the invitation expires, and opening it alone joins nothing', async () => {
    server.previews[token(87)] = [previewOf('Family')];

    const store = await openLink();

    expect(screen.getByText('Family')).toBeTruthy();
    expect(screen.getByText('EUR · Euro')).toBeTruthy();
    expect(screen.getByText('Nov 8, 2026')).toBeTruthy();
    expect(accepts()).toEqual([]);
    expect(store.getState().space.currentSpaceId).toBe(1);
  });

  it('joins only on Join space, then selects the space, refreshes the spaces and lands on Home', async () => {
    server.previews[token(87)] = [previewOf('Family')];
    server.accepts[token(87)] = [ok(family)];
    const store = await openLink();
    const readsBefore = spacesReads();

    await press('Join space');

    expect(accepts()).toEqual([{ token: token(87) }]);
    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(spacesReads()).toBeGreaterThan(readsBefore);
    expect(store.getState().invitation.pending).toBeNull();
    expect(isOnHome()).toBe(true);
  });

  it('sends one join for a double tap', async () => {
    server.previews[token(87)] = [previewOf('Family')];
    const join = held();
    server.accepts[token(87)] = [join.answer];
    await openLink();

    fireEvent.press(button('Join space'));
    fireEvent.press(button(/Join/));
    await settle();

    expect(accepts()).toHaveLength(1);
  });

  it('for another account offers to switch, keeping the invitation, and names no account', async () => {
    server.previews[token(87)] = [refused(403, 'SPACE_INVITE_EMAIL_MISMATCH')];
    await openLink();

    expect(screen.getByText(/sent to a different email address/)).toBeTruthy();
    expect(screen.queryByText(/anna@example\.com/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Join space' })).toBeNull();

    await press('Switch account');

    expect(isOnWelcome()).toBe(true);
    expect(screen.getByText('You’ve been invited to a space')).toBeTruthy();
  });

  it.each([
    ['expired or revoked before it was opened', 'preview'],
    ['revoked while it was on screen', 'accept'],
  ])('%s says so, offers no join and closes to Home', async (_, failing) => {
    server.previews[token(87)] =
      failing === 'preview' ? [refused(404, 'SPACE_INVITE_UNUSABLE')] : [previewOf('Family')];
    server.accepts[token(87)] = [refused(404, 'SPACE_INVITE_UNUSABLE')];
    const store = await openLink();
    if (failing === 'accept') await press('Join space');

    expect(screen.getByText(/no longer available/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Join space' })).toBeNull();
    expect(store.getState().invitation.pending).toBeNull();

    await press('Close');

    expect(isOnHome()).toBe(true);
    expect(store.getState().space.currentSpaceId).toBe(1);
  });

  it('for a space the user is already in opens that space', async () => {
    server.previews[token(87)] = [refused(409, 'SPACE_ALREADY_MEMBER', { spaceId: 41 })];
    const store = await openLink();
    expect(screen.getByText('You’re already a member of this space.')).toBeTruthy();
    expect(store.getState().space.currentSpaceId).toBe(1);

    await press('Open space');

    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(isOnHome()).toBe(true);
  });

  it('to a full space says so, and joins when tried again after a member left', async () => {
    server.previews[token(87)] = [previewOf('Family')];
    server.accepts[token(87)] = [refused(400, 'SPACE_MEMBER_LIMIT_REACHED'), ok(family)];
    const store = await openLink();

    await press('Join space');
    expect(screen.getByText(/This space is full/)).toBeTruthy();
    expect(store.getState().space.currentSpaceId).toBe(1);

    await press('Try again');

    expect(accepts()).toHaveLength(2);
    expect(store.getState().space.currentSpaceId).toBe(41);
  });

  it('offline asks again for the invitation on Try again, never joining by itself', async () => {
    server.previews[token(87)] = [lost, previewOf('Family')];
    await openLink();
    expect(screen.getByText(/Check your connection/)).toBeTruthy();

    await press('Try again');

    expect(screen.getByText('Family')).toBeTruthy();
    expect(accepts()).toEqual([]);
  });

  it('throttled waits out Retry-After before Try again', async () => {
    server.previews[token(87)] = [refused(429, 'TOO_MANY_REQUESTS', {}, { 'retry-after': '30' }), previewOf('Family')];
    await openLink();

    expect(screen.getByText(/^Too many attempts\. Try again in (29|30) s\.$/)).toBeTruthy();
    expect(button(/^Try again in (29|30) s$/).props.accessibilityState?.disabled).toBe(true);

    await settle(30_000);
    await press('Try again');

    expect(screen.getByText('Family')).toBeTruthy();
  });

  it.each([
    ['answered as a repeat', ok(family)],
    ['answered as an earlier membership', refused(409, 'SPACE_ALREADY_MEMBER', { spaceId: 41 })],
  ])('retried after a lost answer joins once (%s)', async (_, retryAnswer) => {
    server.previews[token(87)] = [previewOf('Family')];
    server.accepts[token(87)] = [lost, retryAnswer];
    const store = await openLink();

    await press('Join space');
    expect(screen.getByText(/Check your connection/)).toBeTruthy();
    expect(store.getState().space.currentSpaceId).toBe(1);

    await press('Try again');

    expect(accepts()).toEqual([{ token: token(87) }, { token: token(87) }]);
    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(isOnHome()).toBe(true);
  });

  it('joined by a request that outlived a logout selects nothing in the next session', async () => {
    server.previews[token(87)] = [previewOf('Family')];
    const join = held();
    server.accepts[token(87)] = [join.answer];
    const store = await openLink();

    fireEvent.press(button('Join space'));
    await settle();
    await act(async () => {
      await store.dispatch(logoutMe());
    });
    join.settle(ok(family));
    await settle();
    expect(isOnWelcome()).toBe(true);

    await signIn(store);

    expect(store.getState().space.currentSpaceId).toBe(1);
    expect(invitationsShown()).toBe(0);
  });

  it('keeps the code entry a tap away', async () => {
    server.previews[token(87)] = [previewOf('Family')];
    await openLink();

    fireEvent.press(screen.getByText('Enter a 6-digit code instead'));
    await settle();
    expect(codeFormsShown()).toBe(1);

    fireEvent.press(screen.getByText('Back to the invitation link'));
    await settle();
    expect(screen.getByText('Family')).toBeTruthy();
  });
});

describe('joining with a code', () => {
  it('asks for six digits and joins with them', async () => {
    server.accepts['042917'] = [ok(family)];
    const store = await openCodeForm();

    await enterCode('12345');
    expect(screen.getByText('Enter the 6-digit code')).toBeTruthy();
    expect(accepts()).toEqual([]);

    await enterCode('04-29 17');

    expect(accepts()).toEqual([{ code: '042917' }]);
    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(isOnHome()).toBe(true);
  });

  it('says when no invitation has the code', async () => {
    server.accepts['000000'] = [refused(404, 'NOT_FOUND')];
    await openCodeForm();

    await enterCode('000000');

    expect(screen.getByText(/No invitation for your email has this code/)).toBeTruthy();
  });

  it('opens the space of a code it already joined', async () => {
    server.accepts['042917'] = [refused(409, 'SPACE_ALREADY_MEMBER', { spaceId: 41 })];
    const store = await openCodeForm();

    await enterCode('042917');

    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(isOnHome()).toBe(true);
  });

  it('retried after a lost answer joins once', async () => {
    server.accepts['042917'] = [lost, ok(family)];
    const store = await openCodeForm();

    await enterCode('042917');
    expect(screen.getByText(/Check your connection/)).toBeTruthy();
    await press('Join space');

    expect(accepts()).toHaveLength(2);
    expect(store.getState().space.currentSpaceId).toBe(41);
  });

  it('throttled waits out Retry-After', async () => {
    server.accepts['042917'] = [refused(429, 'TOO_MANY_REQUESTS', {}, { 'retry-after': '20' })];
    await openCodeForm();

    await enterCode('042917');
    await settle();

    expect(screen.getByText(/^Too many attempts\. Try again in \d+ s\.$/)).toBeTruthy();
    expect(button(/^Try again in \d+ s$/).props.accessibilityState?.disabled).toBe(true);
    await settle(20_000);
    expect(button('Join space').props.accessibilityState?.disabled).toBe(false);
  });
});

describe('a code join answered late', () => {
  const storedToken = () => JSON.parse(mockSecureStore.get(PENDING_INVITATION_KEY) ?? 'null')?.token;

  const submitHeldCode = async () => {
    const join = held();
    server.accepts['042917'] = [join.answer];
    fireEvent.changeText(screen.getByLabelText('Invite code'), '042917');
    await settle();
    fireEvent.press(button('Join space'));
    await settle();

    return join;
  };

  const isTabSelected = (name: string) =>
    screen.queryByRole('button', { name: new RegExp(`^${name}`), selected: true }) !== null;

  const chooseCodeEntry = async () => {
    fireEvent.press(screen.getByText('Enter a 6-digit code instead'));
    await settle();
  };

  it.each([
    ['entered as a fallback from a link', async () => (await openLink(), chooseCodeEntry())],
    ['entered directly', async () => void (await openCodeForm())],
  ])('leaves a link received meanwhile open and kept (%s)', async (_, openForm) => {
    server.previews[token(87)] = [previewOf('Family')];
    server.previews[token(88)] = [previewOf('Trip')];
    await openForm();
    const join = await submitHeldCode();

    await receive(link(88));
    expect(screen.getByText('Trip')).toBeTruthy();

    join.settle(ok(family));
    await settle();

    expect(screen.getByText('Trip')).toBeTruthy();
    expect(button('Join space')).toBeTruthy();
    expect(storedToken()).toBe(token(88));

    await chooseCodeEntry();
    expect(screen.getByLabelText('Invite code').props.value).toBe('');
    expect(button('Join space').props.accessibilityState?.disabled).toBe(false);
  });

  it('lands on Home when nothing newer arrived', async () => {
    server.previews[token(87)] = [previewOf('Family')];
    const store = await openLink();
    await chooseCodeEntry();
    const join = await submitHeldCode();

    join.settle(ok(family));
    await settle();

    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(isOnHome()).toBe(true);
  });

  it('moves nothing once the invitation was declined', async () => {
    server.previews[token(87)] = [previewOf('Family')];
    const store = await openLink();
    await chooseCodeEntry();
    const join = await submitHeldCode();
    fireEvent.press(screen.getByText('Back to the invitation link'));
    await settle();
    await press('Not now');
    fireEvent.press(screen.getByText('Profile'));
    await settle();
    expect(isTabSelected('Profile')).toBe(true);

    join.settle(ok(family));
    await settle();

    expect(store.getState().space.currentSpaceId).toBe(41);
    expect(isTabSelected('Profile')).toBe(true);
    expect(invitationsShown() + codeFormsShown()).toBe(0);
  });

  it('after a sign-out selects nothing and opens nothing', async () => {
    const store = await openCodeForm();
    const join = await submitHeldCode();
    await act(async () => {
      await store.dispatch(logoutMe());
    });

    join.settle(ok(family));
    await settle();
    expect(isOnWelcome()).toBe(true);

    await signIn(store);
    expect(store.getState().space.currentSpaceId).toBe(1);
    expect(codeFormsShown()).toBe(0);
  });
});

describe('signed out with an invitation', () => {
  it('explains on Welcome and Sign In to use the invited email', async () => {
    setInitialUrl(link(87));
    await openApp();

    expect(screen.getByText('You’ve been invited to a space')).toBeTruthy();
    expect(screen.getByText(/with the email the invitation was sent to/)).toBeTruthy();

    await press('Sign In');
    expect(screen.getAllByText('You’ve been invited to a space').length).toBeGreaterThan(0);
  });

  it('says nothing without one', async () => {
    await openApp();

    expect(screen.queryByText('You’ve been invited to a space')).toBeNull();
  });
});
