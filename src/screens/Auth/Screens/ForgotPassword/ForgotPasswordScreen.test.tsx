import 'react-native-gesture-handler/jestSetup';
import * as SecureStore from 'expo-secure-store';
import type { KeyboardMetrics } from 'react-native';
import { Dimensions, Keyboard } from 'react-native';
import { act, fireEvent, screen } from '@testing-library/react-native';

import {
  answer,
  button,
  header,
  held,
  isDisabled,
  lost,
  mockRequest,
  openForgotPassword,
  press,
  refused,
  REQUESTED,
  sentTo,
  settle,
  type,
} from '@screens/Auth/passwordReset/flowFixtures';

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
jest.mock('expo-secure-store');
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn() }));

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
});

it('sends the trimmed address and opens code entry', async () => {
  answer({ request: [REQUESTED] });

  await openForgotPassword('');
  await type('Account email', '  anna@kovalenko.co ');
  await press('Send code');

  expect(sentTo('request')).toEqual([{ email: 'anna@kovalenko.co' }]);
  expect(header('Check your email')).toBeTruthy();
  expect(screen.getByText('anna@kovalenko.co')).toBeTruthy();
});

it('moves on for an address with no account, as the server answers every address the same', async () => {
  answer({ request: [REQUESTED] });

  await openForgotPassword('');
  await type('Account email', 'nobody@example.com');
  await press('Send code');

  expect(header('Check your email')).toBeTruthy();
  expect(screen.getByText('nobody@example.com')).toBeTruthy();
});

it('keeps Send code off until the address is complete, with a hint instead of an error', async () => {
  await openForgotPassword('');

  expect(isDisabled('Send code')).toBe(true);
  expect(screen.getByLabelText('Account email').props.accessibilityHint).toBeUndefined();

  await type('Account email', 'anna@kovalenko');

  expect(isDisabled('Send code')).toBe(true);
  expect(screen.getByLabelText('Account email').props.accessibilityHint).toBe(
    'Enter the full address, like you@example.com.',
  );

  await type('Account email', 'anna@kovalenko.co');

  expect(isDisabled('Send code')).toBe(false);
  expect(screen.getByLabelText('Account email').props.accessibilityHint).toBeUndefined();
});

it('locks the form while sending and sends once however often Send code is pressed', async () => {
  const pending = held();

  answer({ request: [pending.answer] });
  await openForgotPassword();

  await act(async () => {
    fireEvent.press(button('Send code'));
    fireEvent.press(button('Send code'));
  });

  expect(button('Sending code…').props.accessibilityState).toMatchObject({ busy: true });
  expect(screen.getByLabelText('Account email').props.editable).toBe(false);
  expect(isDisabled('Back to sign in')).toBe(true);

  await act(async () => pending.settle(REQUESTED));
  await settle();

  expect(sentTo('request')).toHaveLength(1);
  expect(header('Check your email')).toBeTruthy();
});

it('keeps the address after a lost request, and Retry sends the same one', async () => {
  answer({ request: [lost, REQUESTED] });

  await openForgotPassword();
  await press('Send code');

  expect(screen.getByText('Couldn’t reach the server')).toBeTruthy();
  expect(screen.getByLabelText('Account email').props.value).toBe('anna@kovalenko.co');

  await press('Retry');

  expect(sentTo('request')).toEqual([{ email: 'anna@kovalenko.co' }, { email: 'anna@kovalenko.co' }]);
  expect(header('Check your email')).toBeTruthy();
});

it('explains a server failure apart from a lost connection', async () => {
  answer({ request: [refused(503, 'SERVICE_UNAVAILABLE')] });

  await openForgotPassword();
  await press('Send code');

  expect(screen.getByText('Recovery is temporarily unavailable')).toBeTruthy();
  expect(header('Reset password')).toBeTruthy();
});

it('waits out the server’s Retry-After before Send code works again, unless the address changes', async () => {
  answer({ request: [refused(429, 'TOO_MANY_REQUESTS', { 'retry-after': '20' })] });

  await openForgotPassword();
  await press('Send code');

  expect(screen.getByText('Too many attempts')).toBeTruthy();
  expect(screen.getByText(/Try again in 1\d seconds\./)).toBeTruthy();
  expect(isDisabled('Send code')).toBe(true);

  await settle(20_000);

  expect(screen.getByText('You can try again now.')).toBeTruthy();
  expect(isDisabled('Send code')).toBe(false);

  answer({ request: [refused(429, 'TOO_MANY_REQUESTS', { 'retry-after': '20' })] });
  await press('Send code');
  await type('Account email', 'other@example.com');

  expect(screen.queryByText('Too many attempts')).toBeNull();
  expect(isDisabled('Send code')).toBe(false);
});

it('drops a request whose screen was left before it answered', async () => {
  const pending = held();

  answer({ request: [pending.answer] });
  const store = await openForgotPassword();

  await act(async () => {
    fireEvent.press(button('Send code'));
  });
  await press('Back');
  await act(async () => pending.settle(REQUESTED));
  await settle();

  expect(header('Welcome back')).toBeTruthy();
  expect(store.getState().passwordReset.email).toBeNull();
});

describe('keyboard', () => {
  afterEach(() => jest.restoreAllMocks());

  const keyboardUp = () =>
    jest
      .spyOn(Keyboard, 'metrics')
      .mockReturnValue({ height: 300, screenX: 0, screenY: 500, width: 393 } as KeyboardMetrics);

  const isInScroll = (element: { type: unknown; parent: unknown } | null): boolean =>
    element !== null && (element.type === 'RCTScrollView' || isInScroll(element.parent as typeof element));

  it('follows the content without a keyboard, and is pinned outside the scroll above one', async () => {
    await openForgotPassword();
    expect(isInScroll(button('Send code'))).toBe(true);

    keyboardUp();
    await press('Back');
    fireEvent.press(screen.getByText('Forgot password?'));
    await settle();

    expect(isInScroll(button('Send code'))).toBe(false);
  });

  it('keeps Back to sign in above the keyboard where there is room', async () => {
    keyboardUp();
    await openForgotPassword();

    expect(button('Send code')).toBeTruthy();
    expect(button('Back to sign in')).toBeTruthy();
  });

  it('keeps only Send code above the keyboard on a small screen', async () => {
    const window = Dimensions.get('window');

    keyboardUp();
    await act(async () => {
      Dimensions.set({ window: { ...window, height: 667 }, screen: { ...window, height: 667 } });
    });
    await openForgotPassword();

    expect(button('Send code')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Back to sign in' })).toBeNull();

    await act(async () => {
      Dimensions.set({ window, screen: window });
    });
  });
});
