import 'react-native-gesture-handler/jestSetup';
import * as SecureStore from 'expo-secure-store';
import { act, fireEvent, screen } from '@testing-library/react-native';

import {
  answer,
  button,
  header,
  held,
  lost,
  mockRequest,
  ok,
  press,
  reachNewPassword,
  refused,
  REQUESTED,
  savePassword,
  sentTo,
  settle,
  type,
  VERIFIED,
} from '@screens/Auth/passwordReset/flowFixtures';
import { utf8Length } from './useNewPasswordForm';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
// Sign-in goes through the same mock, so a test can sign in with the new password.
jest.mock('@api/instance', () => ({
  ApiClient: () => ({
    post: (url: string, data: unknown) => mockRequest({ url, data, method: 'POST' }),
  }),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn() }));

jest.useFakeTimers();

const INITIAL = { email: null, resendAvailableAt: null, challenge: null, authorization: null };
const DONE = ok(null);
const AUTHORIZATION_INVALID = refused(400, 'PASSWORD_RESET_AUTHORIZATION_INVALID');

const field = (label: string) => screen.getByLabelText(label);
const errorOf = (label: string) => field(label).props.accessibilityHint;

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
});

describe('validation', () => {
  it('keeps Save on and reports both missing values on it', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED] });
    await reachNewPassword();

    expect(header('Create a new password')).toBeTruthy();
    expect(screen.getByText('Code confirmed for anna@kovalenko.co.')).toBeTruthy();
    expect(button('Save new password').props.accessibilityState).toMatchObject({ disabled: false });

    await press('Save new password');

    expect(errorOf('New password')).toBe('Enter a new password.');
    expect(errorOf('Confirm password')).toBe('Repeat the new password.');
    expect(sentTo('complete')).toEqual([]);
  });

  it('shows a weak password’s missing rules and leaves the match for later', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED] });
    await reachNewPassword();

    await savePassword('sunny');

    expect(errorOf('New password')).toBe('Too weak. Add what’s missing below.');
    expect(errorOf('Confirm password')).toBeUndefined();
    expect(screen.getByLabelText('8+ characters, missing')).toBeTruthy();
    expect(screen.getByLabelText('A letter, done')).toBeTruthy();
    expect(screen.getByLabelText('A number, missing')).toBeTruthy();
    expect(sentTo('complete')).toEqual([]);
  });

  it('updates the rules as the password is typed, before any Save', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED] });
    await reachNewPassword();

    expect(screen.getByLabelText('A number, missing')).toBeTruthy();

    await type('New password', 'sunny2026');

    expect(screen.getByLabelText('8+ characters, done')).toBeTruthy();
    expect(screen.getByLabelText('A number, done')).toBeTruthy();
    expect(errorOf('New password')).toBe('At least 8 characters, including a letter and a number.');
  });

  it('reports a mismatch, then clears it as soon as the confirmation matches', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [DONE] });
    await reachNewPassword();

    await type('New password', 'sunny2026');
    await type('Confirm password', 'sunny2062');
    await press('Save new password');

    expect(errorOf('Confirm password')).toBe('Passwords don’t match.');
    expect(sentTo('complete')).toEqual([]);

    await type('Confirm password', 'sunny2026');

    expect(errorOf('Confirm password')).toBeUndefined();
  });

  it('refuses more than 72 bytes, counting accented letters as two', async () => {
    const accented = `${'é'.repeat(36)}a1`;

    expect(accented).toHaveLength(38);
    expect(utf8Length(accented)).toBe(74);

    answer({ request: [REQUESTED], verify: [VERIFIED] });
    await reachNewPassword();
    await savePassword(accented);

    expect(errorOf('New password')).toBe('Too long. Use a shorter password.');
    expect(sentTo('complete')).toEqual([]);
  });
});

describe('visibility', () => {
  it('shows and hides each password on its own', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED] });
    await reachNewPassword();
    await type('New password', 'sunny2026');

    expect(field('New password').props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getAllByLabelText('Show password')[0]);
    await settle();

    expect(field('New password').props.secureTextEntry).toBe(false);
    expect(field('Confirm password').props.secureTextEntry).toBe(true);
    expect(screen.getByLabelText('Hide password')).toBeTruthy();
    expect(field('New password').props.value).toBe('sunny2026');
  });
});

describe('submission', () => {
  it('sends the authorization with the new password once, however often Save is pressed', async () => {
    const pending = held();

    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [pending.answer] });
    await reachNewPassword();
    await type('New password', 'sunny2026');
    await type('Confirm password', 'sunny2026');

    const save = button('Save new password');

    await act(async () => {
      fireEvent.press(save);
      fireEvent.press(save);
    });

    expect(button('Saving…').props.accessibilityState).toMatchObject({ busy: true });
    expect(field('New password').props.editable).toBe(false);

    await act(async () => pending.settle(DONE));
    await settle();

    expect(sentTo('complete')).toEqual([{ reset_token: 'reset-token', password: 'sunny2026' }]);
  });

  it('keeps the authorization and both passwords when the server refuses the password itself', async () => {
    answer({
      request: [REQUESTED],
      verify: [VERIFIED],
      complete: [refused(400, 'VALIDATION_FAILED'), DONE],
    });
    const store = await reachNewPassword();
    await savePassword();

    expect(screen.getByText('Couldn’t reset the password')).toBeTruthy();
    expect(field('New password').props.value).toBe('sunny2026');
    expect(store.getState().passwordReset.authorization).not.toBeNull();

    await press('Save new password');

    expect(header('Welcome back')).toBeTruthy();
  });

  it('keeps both passwords after a server failure, and Try again sends them again', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [refused(503, 'UNAVAILABLE'), DONE] });
    await reachNewPassword();
    await savePassword();

    expect(screen.getByText('Recovery is temporarily unavailable')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign in with the new password' })).toBeNull();

    await press('Try again');

    expect(sentTo('complete')).toHaveLength(2);
    expect(screen.getByText('Password updated.')).toBeTruthy();
  });
});

describe('a lost answer', () => {
  it('never reports success or failure, and offers retry or signing in with the new password', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [lost] });
    await reachNewPassword();
    await savePassword();

    expect(screen.getByText('Couldn’t confirm the new password')).toBeTruthy();
    expect(screen.queryByText('Password updated.')).toBeNull();
    expect(field('New password').props.value).toBe('sunny2026');

    await press('Sign in with the new password');

    expect(header('Welcome back')).toBeTruthy();
    expect(screen.getByText('Your password may have changed')).toBeTruthy();
    expect(screen.queryByText('Password updated.')).toBeNull();
    expect(field('Email').props.value).toBe('anna@kovalenko.co');
  });

  it('treats a refused retry as a possible change, and Reset again restarts recovery for the address', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [lost, AUTHORIZATION_INVALID] });
    const store = await reachNewPassword();
    await savePassword();
    await press('Retry');

    expect(header('Welcome back')).toBeTruthy();
    expect(screen.getByText('Your password may have changed')).toBeTruthy();
    expect(store.getState().passwordReset).toEqual(INITIAL);

    await press('Reset again');

    expect(header('Reset password')).toBeTruthy();
    expect(field('Account email').props.value).toBe('anna@kovalenko.co');
  });

  it('reports success when the retry goes through', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [lost, DONE] });
    await reachNewPassword();
    await savePassword();
    await press('Retry');

    expect(screen.getByText('Password updated.')).toBeTruthy();
  });
});

describe('after a completed reset', () => {
  it('returns to Sign In with the address, an empty password and nothing left of recovery', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [DONE] });
    const store = await reachNewPassword();
    await savePassword();

    expect(header('Welcome back')).toBeTruthy();
    expect(screen.getByText('Password updated.')).toBeTruthy();
    expect(field('Email').props.value).toBe('anna@kovalenko.co');
    expect(field('Password').props.value).toBe('');
    expect(store.getState().passwordReset).toEqual(INITIAL);
    expect(store.getState().api.mutations).toEqual({});
    expect(store.getState().auth).toMatchObject({ isSignedIn: false, userToken: null });
  });

  it('can’t go back to the password form: Back leaves Sign In for Welcome', async () => {
    answer({ request: [REQUESTED], verify: [VERIFIED], complete: [DONE] });
    await reachNewPassword();
    await savePassword();

    await press('Back');

    expect(screen.getByText('See where the money goes')).toBeTruthy();
    expect(screen.queryByLabelText('New password')).toBeNull();
    expect(header('Check your email')).toBeNull();
  });

  it('signs in with the new password', async () => {
    answer({
      request: [REQUESTED],
      verify: [VERIFIED],
      complete: [DONE],
      '/users/login': [ok('new-access-token')],
    });
    const store = await reachNewPassword();
    await savePassword();

    await type('Password', 'sunny2026');
    await press('Sign In');

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/users/login', data: { email: 'anna@kovalenko.co', password: 'sunny2026' } }),
    );
    expect(store.getState().auth.isSignedIn).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(expect.any(String), 'new-access-token');
  });
});
