import { ScrollView, Text } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import type { InviteEmailStatus, SpaceMember } from '@api/dto';
import { resetSheets, withSheetHost } from '@components/ConfirmationSheet/testing';
import { toastCount, withToasts } from '@components/Toast/testing';
import { useToastControl } from '@components/Toast/ToastProvider';
import focusedRoutePath from '@navigation/focusedRoutePath';
import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { profileApi } from '@redux/state/profile/api';
import { spaceApi } from '@redux/state/space/api';
import { activateSpace } from '@redux/state/space/thunks';
import { ScreenNames, SpaceType } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';
import { DELIVERY_POLL_INTERVAL_MS, DELIVERY_POLL_WINDOW_MS } from './hooks/useDeliveryPolling';
import MembersScreen from './MembersScreen';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

jest.useFakeTimers();

interface Request {
  method: string;
  url: string;
}
type Answer = () => Promise<unknown>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const owner: SpaceMember = {
  type: 'member',
  id: 1,
  user_id: 7,
  name: 'Owner',
  email: 'owner@example.com',
  role: 'owner',
  can_remove: false,
  email_status: null,
  can_resend: false,
  resend_after_seconds: null,
};

const invitation = (id: number, email: string, status: InviteEmailStatus, resendAfter = 0): SpaceMember => ({
  type: 'invite',
  id,
  user_id: null,
  name: null,
  role: null,
  email,
  can_remove: true,
  email_status: status,
  can_resend: status !== 'sending' && resendAfter === 0,
  resend_after_seconds: resendAfter,
});

const created = {
  id: 87,
  email: 'anna@example.com',
  expires_at: '2026-11-08T10:00:00.000Z',
  code: '042917',
  email_status: 'queued',
  resend_after_seconds: 60,
};

const ok =
  (data: unknown): Answer =>
  () =>
    Promise.resolve({ data });
const refused =
  (status: number, code: string, headers: Record<string, string> = {}): Answer =>
  () =>
    Promise.reject({ response: { status, data: { statusCode: status, code, message: code }, headers } });

// The roster as the server has it now, and the answers to resends in turn.
let roster: SpaceMember[];
let resends: Answer[];

const route = ({ method, url }: Request) => {
  if (method === 'GET' && url === '/spaces/10/members') return ok(roster)();
  if (method === 'POST' && url === '/spaces/10/invites') return ok(created)();
  if (method === 'POST' && url.endsWith('/resend')) return (resends.shift() ?? ok({}))();

  return new Promise(() => {});
};

const rosterReads = () =>
  mockedRequest.mock.calls.filter(([{ method, url }]: [Request]) => method === 'GET' && url === '/spaces/10/members')
    .length;
const writesSent = () =>
  mockedRequest.mock.calls
    .map(([config]: [Request]) => config)
    .filter(({ method }) => method !== 'GET')
    .map(({ method, url }) => `${method} ${url}`);
const resendButton = () => screen.getByRole('button', { name: /^Resend( in \d+s)? invitation email$/ });
const resendsSent = () =>
  mockedRequest.mock.calls.filter(([{ url }]: [Request]) => url.endsWith('/resend')).map(([{ url }]) => url);

const settle = (ms = 0) => act(() => jest.advanceTimersByTimeAsync(ms));

const Elsewhere = () => <Text>Elsewhere</Text>;

// Tells the toasts which screen is focused, as RootNavigator does.
const Navigation = () => {
  const { reportRoute } = useToastControl();
  const report = () => reportRoute(focusedRoutePath(navigationRef.getRootState()), false);

  return (
    <NavigationContainer ref={navigationRef} onReady={report} onStateChange={report}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ScreenNames.MEMBERS_SCREEN} component={MembersScreen} />
        <Stack.Screen name={ScreenNames.CATEGORIES_SCREEN} component={Elsewhere} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const openMembers = async ({ role = 'owner' }: { role?: 'owner' | 'member' } = {}) => {
  const store = createAppStore();
  store.dispatch(
    profileApi.util.upsertQueryEntries([
      { endpointName: 'getProfile', arg: undefined, value: { id: 7, email: 'owner@example.com', name: 'Owner' } },
    ]),
  );
  store.dispatch(
    spaceApi.util.upsertQueryEntries([
      {
        endpointName: 'getSpaces',
        arg: undefined,
        value: [
          {
            id: 10,
            name: 'Family',
            type: SpaceType.GROUP,
            currency: { id: 3, code: 'EUR', name: 'Euro' },
            role,
            member_count: 1,
            created_at: '2026-11-01T10:00:00.000Z',
          },
        ],
      },
    ]),
  );
  // Kept subscribed, as the session data keeps it in the app.
  store.dispatch(spaceApi.endpoints.getSpaces.initiate());
  store.dispatch(activateSpace(10));

  render(<Provider store={store}>{withSheetHost(withToasts(<Navigation />))}</Provider>);
  await settle();

  return store;
};

const invite = async (email = 'anna@example.com') => {
  fireEvent.changeText(screen.getByPlaceholderText('name@email.com'), email);
  fireEvent.press(screen.getByText('Invite'));
  await settle();
};

beforeEach(() => {
  jest.clearAllMocks();
  resetSheets();
  roster = [owner];
  resends = [];
  mockedRequest.mockImplementation(route);
});

describe('layout', () => {
  it('heads the screen with Members over the space name and currency', async () => {
    await openMembers();

    expect(screen.getByRole('header', { name: 'Members' })).toBeTruthy();
    expect(screen.getByText('Family · EUR')).toBeTruthy();
  });

  it('keeps the leave section in the scrolling content, after the list', async () => {
    roster = [
      owner,
      ...Array.from({ length: 10 }, (_, index) => invitation(90 + index, `p${index}@example.com`, 'sent')),
    ];
    await openMembers();

    const scroll = screen.UNSAFE_getByType(ScrollView);
    expect(within(scroll).getByText('Leave this space')).toBeTruthy();
    expect(within(scroll).getAllByText('Invited member')).toHaveLength(10);
  });
});

describe('inviting by email', () => {
  it('says they’ll get an email with a link, and never that there is no email', async () => {
    await openMembers();

    expect(screen.getByText('They’ll get an email with a link to join.')).toBeTruthy();
    expect(screen.queryByText(/no email/i)).toBeNull();
  });

  it('says the email is on its way until the roster says sent, then stops asking', async () => {
    await openMembers();
    roster = [owner, invitation(87, 'anna@example.com', 'queued', 60)];

    await invite();

    expect(screen.getByText('Invitation created')).toBeTruthy();
    expect(screen.getByText('Sending email…')).toBeTruthy();
    expect(screen.queryByText('Invitation email sent')).toBeNull();
    expect(screen.queryByText(/042917/)).toBeNull();

    roster = [owner, invitation(87, 'anna@example.com', 'sent', 55)];
    await settle(DELIVERY_POLL_INTERVAL_MS);

    expect(screen.getByText('Invitation email sent')).toBeTruthy();
    const reads = rosterReads();
    await settle(DELIVERY_POLL_INTERVAL_MS * 4);
    expect(rosterReads()).toBe(reads);
  });

  it('keeps the code a tap away as a fallback', async () => {
    await openMembers();
    roster = [owner, invitation(87, 'anna@example.com', 'queued', 60)];
    await invite();

    fireEvent.press(screen.getByRole('button', { name: 'Share code' }));
    await settle();

    expect(screen.getByText('042917')).toBeTruthy();
  });

  it('says when the email could not be sent, and sends it again on Retry', async () => {
    await openMembers();
    roster = [owner, invitation(87, 'anna@example.com', 'queued', 60)];
    await invite();
    roster = [owner, invitation(87, 'anna@example.com', 'failed')];
    await settle(DELIVERY_POLL_INTERVAL_MS);

    expect(screen.getByText('Couldn’t send the email')).toBeTruthy();
    expect(screen.queryByText('Invitation email sent')).toBeNull();

    roster = [owner, invitation(87, 'anna@example.com', 'queued', 60)];
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    await settle();

    expect(resendsSent()).toEqual(['/spaces/10/invites/87/resend']);
    expect(screen.getByText('Sending email…')).toBeTruthy();
  });

  it('holds a refused retry for the Retry-After of its 429, longer than the roster’s cooldown', async () => {
    roster = [owner, invitation(87, 'anna@example.com', 'failed')];
    resends = [refused(429, 'SPACE_INVITE_RATE_LIMITED', { 'retry-after': '120' })];
    await openMembers();

    fireEvent.press(screen.getByRole('button', { name: 'Resend invitation email' }));
    await settle();
    await settle(1000);

    expect(
      screen.getByRole('button', { name: /^Resend in 1\d\ds invitation email$/ }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(toastCount()).toBe(0);

    await settle(120_000);
    expect(screen.getByRole('button', { name: 'Resend invitation email' }).props.accessibilityState?.disabled).toBe(
      false,
    );
  });

  it('offers a resend at once when the roster arrives after the screen first drew', async () => {
    roster = [owner, invitation(88, 'ben@example.com', 'failed')];
    let answerRoster: () => void = () => {};
    mockedRequest.mockImplementationOnce(
      () => new Promise((resolve) => (answerRoster = () => resolve({ data: roster }))),
    );
    await openMembers();
    await settle(2000);

    answerRoster();
    await settle(100);
    await settle(100);

    expect(screen.getByRole('button', { name: 'Resend invitation email' }).props.accessibilityState?.disabled).toBe(
      false,
    );
  });

  it('waits out the roster’s cooldown before offering a resend', async () => {
    roster = [owner, invitation(87, 'anna@example.com', 'failed', 30)];
    await openMembers();
    await settle(1000);

    expect(
      screen.getByRole('button', { name: /^Resend in \d+s invitation email$/ }).props.accessibilityState,
    ).toMatchObject({
      disabled: true,
    });

    await settle(30_000);
    expect(screen.getByRole('button', { name: 'Resend invitation email' }).props.accessibilityState?.disabled).toBe(
      false,
    );
  });
});

describe('pending invitations', () => {
  it('show which emails of a new space went out and which did not', async () => {
    roster = [
      owner,
      invitation(87, 'anna@example.com', 'sent', 40),
      invitation(88, 'ben@example.com', 'failed'),
      invitation(89, 'cy@example.com', 'queued', 60),
    ];
    await openMembers();

    expect(screen.getAllByText('Invited member')).toHaveLength(3);
    expect(screen.getAllByLabelText('Email not sent')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /Resend/ })).toHaveLength(2);
    expect(screen.getByText('1 member · 3 pending')).toBeTruthy();
  });

  it('are asked for again for a bounded time while an email is queued, and not once the screen is left', async () => {
    roster = [owner, invitation(89, 'cy@example.com', 'queued', 60)];
    await openMembers();
    const first = rosterReads();

    await settle(DELIVERY_POLL_INTERVAL_MS * 2);
    expect(rosterReads()).toBe(first + 2);

    act(() => navigationRef.navigate(ScreenNames.CATEGORIES_SCREEN));
    await settle();
    const away = rosterReads();
    await settle(DELIVERY_POLL_INTERVAL_MS * 4);
    expect(rosterReads()).toBe(away);

    act(() => navigationRef.goBack());
    await settle(DELIVERY_POLL_WINDOW_MS + DELIVERY_POLL_INTERVAL_MS);
    const afterWindow = rosterReads();
    await settle(DELIVERY_POLL_INTERVAL_MS * 4);
    expect(rosterReads()).toBe(afterWindow);
  });

  it('are left alone by a resend answered after the session ended', async () => {
    roster = [owner, invitation(88, 'ben@example.com', 'failed')];
    let answer: (answer: Answer) => void = () => {};
    resends = [() => new Promise((resolve, reject) => (answer = (next) => next().then(resolve, reject)))];
    const store = await openMembers();

    fireEvent.press(screen.getByRole('button', { name: 'Resend invitation email' }));
    await settle();
    store.dispatch(logoutMe.fulfilled(undefined, 'logout', undefined));
    answer(refused(500, 'INTERNAL_SERVER_ERROR'));
    await settle(1000);

    expect(toastCount()).toBe(0);
  });

  it('report a resend that failed for another reason', async () => {
    roster = [owner, invitation(88, 'ben@example.com', 'failed')];
    resends = [refused(500, 'INTERNAL_SERVER_ERROR')];
    await openMembers();

    fireEvent.press(screen.getByRole('button', { name: 'Resend invitation email' }));
    await settle(1000);

    expect(toastCount()).toBe(1);
  });
});

describe('resending a sent invitation', () => {
  it('sends another email for the same invitation, then waits for the roster’s state', async () => {
    roster = [owner, invitation(87, 'anna@example.com', 'sent')];
    await openMembers();
    expect(screen.queryByLabelText('Email not sent')).toBeNull();

    roster = [owner, invitation(87, 'anna@example.com', 'queued', 60)];
    fireEvent.press(resendButton());
    await settle();

    expect(writesSent()).toEqual(['POST /spaces/10/invites/87/resend']);
    expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();

    roster = [owner, invitation(87, 'anna@example.com', 'sent', 55)];
    await settle(DELIVERY_POLL_INTERVAL_MS);
    expect(resendButton().props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.queryByLabelText('Email not sent')).toBeNull();
  });

  it('waits out the roster’s cooldown, then a refusal’s Retry-After', async () => {
    roster = [owner, invitation(87, 'anna@example.com', 'sent', 30)];
    resends = [refused(429, 'SPACE_INVITE_RATE_LIMITED', { 'retry-after': '90' })];
    await openMembers();
    await settle(1000);

    expect(resendButton().props.accessibilityLabel).toMatch(/^Resend in \d+s/);
    fireEvent.press(resendButton());
    await settle();
    expect(resendsSent()).toEqual([]);

    await settle(30_000);
    expect(resendButton().props.accessibilityState?.disabled).toBe(false);
    fireEvent.press(resendButton());
    await settle(1000);

    expect(resendsSent()).toHaveLength(1);
    expect(resendButton().props.accessibilityLabel).toMatch(/^Resend in [89]\ds/);
    expect(toastCount()).toBe(0);
  });

  it('takes one press at a time', async () => {
    roster = [owner, invitation(87, 'anna@example.com', 'sent')];
    resends = [() => new Promise(() => {})];
    await openMembers();

    fireEvent.press(resendButton());
    await settle();
    fireEvent.press(resendButton());
    await settle();

    expect(resendsSent()).toHaveLength(1);
    expect(resendButton().props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  });

  it('leaves no resend for an invitation accepted or revoked meanwhile', async () => {
    roster = [owner, invitation(87, 'anna@example.com', 'sent')];
    resends = [refused(404, 'NOT_FOUND')];
    await openMembers();

    roster = [owner];
    fireEvent.press(resendButton());
    await settle(1000);

    expect(screen.queryByText('Invited member')).toBeNull();
    expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();
    expect(toastCount()).toBe(0);
  });

  it('is offered from the roster after a restart, not from the invite that created it', async () => {
    await openMembers();
    roster = [owner, invitation(87, 'anna@example.com', 'queued', 60)];
    await invite();
    expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();

    screen.unmount();
    roster = [owner, invitation(87, 'anna@example.com', 'sent', 0)];
    await openMembers();

    expect(screen.queryByText('Invitation created')).toBeNull();
    expect(resendButton().props.accessibilityState?.disabled).toBe(false);
  });

  it('is not offered to a member who does not own the space', async () => {
    roster = [owner, invitation(87, 'anna@example.com', 'sent'), invitation(88, 'ben@example.com', 'failed')];
    await openMembers({ role: 'member' });

    expect(screen.getAllByText('Invited member')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Resend/ })).toBeNull();
  });
});
