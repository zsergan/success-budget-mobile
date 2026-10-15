import 'react-native-gesture-handler/jestSetup';
import * as SecureStore from 'expo-secure-store';
import { act, fireEvent, screen } from '@testing-library/react-native';

import {
  answer,
  header,
  lost,
  mockRequest,
  ok,
  openForgotPassword,
  press,
  reachCode,
  reachNewPassword,
  refused,
  REQUESTED,
  savePassword,
  sentTo,
  settle,
  type,
  VERIFIED,
} from './flowFixtures';

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

const INITIAL = { email: null, resendAvailableAt: null, challenge: null, authorization: null };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
});

it('runs from Forgot password to Sign In with the address carried both ways, without signing in', async () => {
  answer({ request: [REQUESTED], verify: [VERIFIED], complete: [ok(null)] });

  const store = await reachNewPassword();

  expect(header('Create a new password')).toBeTruthy();

  await savePassword();

  expect(sentTo('request')).toEqual([{ email: 'anna@kovalenko.co' }]);
  expect(sentTo('verify')).toEqual([{ email: 'anna@kovalenko.co', code: '042917' }]);
  expect(sentTo('complete')).toEqual([{ reset_token: 'reset-token', password: 'sunny2026' }]);
  expect(header('Welcome back')).toBeTruthy();
  expect(screen.getByText('Password updated.')).toBeTruthy();
  expect(screen.getByLabelText('Email').props.value).toBe('anna@kovalenko.co');
  expect(screen.getByLabelText('Password').props.value).toBe('');
  expect(store.getState().passwordReset).toEqual(INITIAL);
  expect(store.getState().auth).toMatchObject({ isSignedIn: false, userToken: null, userEmail: null });
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

it('carries only a complete address from Sign In', async () => {
  await openForgotPassword('anna@kovalenko');

  expect(screen.getByLabelText('Account email').props.value).toBe('');
});

it('ends the flow when it is left for Sign In', async () => {
  answer({ request: [REQUESTED] });

  const store = await reachCode();

  expect(store.getState().passwordReset.email).toBe('anna@kovalenko.co');

  fireEvent.press(screen.getByText('Sign In'));
  await settle();

  expect(header('Welcome back')).toBeTruthy();
  expect(store.getState().passwordReset).toEqual(INITIAL);
});

it('returns to the code without a new request while the same address’s cooldown runs, and drops it for another address', async () => {
  answer({ request: [REQUESTED, REQUESTED] });

  const store = await reachCode();

  await press('Change email');
  await press('Send code');

  expect(header('Check your email')).toBeTruthy();
  expect(screen.getByText(/you can resend in 0:5\d\./)).toBeTruthy();
  expect(sentTo('request')).toHaveLength(1);

  await press('Back');
  await type('Account email', 'other@example.com');

  expect(store.getState().passwordReset.email).toBeNull();

  await press('Send code');

  expect(sentTo('request')).toHaveLength(2);
  expect(screen.getByText('other@example.com')).toBeTruthy();
});

it('discards the authorization when going back from the new password', async () => {
  answer({ request: [REQUESTED], verify: [VERIFIED] });

  const store = await reachNewPassword();

  expect(store.getState().passwordReset.authorization).not.toBeNull();

  await press('Back');

  expect(header('Check your email')).toBeTruthy();
  expect(screen.getByLabelText('6-digit code').props.value).toBe('');
  expect(store.getState().passwordReset.authorization).toBeNull();
  expect(store.getState().passwordReset.email).toBe('anna@kovalenko.co');
});

it('sends an expired authorization back to the code screen to request a new code', async () => {
  answer({
    request: [REQUESTED, REQUESTED],
    verify: [VERIFIED],
    complete: [refused(400, 'PASSWORD_RESET_AUTHORIZATION_INVALID')],
  });

  await reachNewPassword();
  await savePassword();

  expect(header('Check your email')).toBeTruthy();
  expect(screen.getByText('Time to set a password ran out')).toBeTruthy();

  await act(() => jest.advanceTimersByTimeAsync(60_000));
  await press('Send new code');

  expect(sentTo('request')).toHaveLength(2);
  expect(screen.queryByText('Time to set a password ran out')).toBeNull();
  expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
});

it('checks the authorization’s expiry before sending the password', async () => {
  answer({ request: [REQUESTED], verify: [VERIFIED] });

  await reachNewPassword();
  await act(() => jest.advanceTimersByTimeAsync(600_000));
  await savePassword();

  expect(sentTo('complete')).toEqual([]);
  expect(screen.getByText('Time to set a password ran out')).toBeTruthy();
});

it('keeps the passwords after a lost save, and treats a refused retry as a possible change', async () => {
  answer({
    request: [REQUESTED],
    verify: [VERIFIED],
    complete: [lost, refused(400, 'PASSWORD_RESET_AUTHORIZATION_INVALID')],
  });

  await reachNewPassword();
  await savePassword();

  expect(screen.getByText('Couldn’t reach the server')).toBeTruthy();
  expect(screen.getByLabelText('New password').props.value).toBe('sunny2026');

  await press('Retry');

  expect(header('Welcome back')).toBeTruthy();
  expect(screen.getByText('Your password may have changed')).toBeTruthy();
  expect(screen.getByLabelText('Email').props.value).toBe('anna@kovalenko.co');
});

it('checks the new password on the device before sending it', async () => {
  answer({ request: [REQUESTED], verify: [VERIFIED] });

  await reachNewPassword();
  await savePassword('sunnyday');

  expect(screen.getByLabelText('New password').props.accessibilityHint).toMatch(/^Too weak/);
  expect(sentTo('complete')).toEqual([]);
});
