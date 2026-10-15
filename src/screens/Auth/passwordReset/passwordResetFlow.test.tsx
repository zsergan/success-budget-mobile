import 'react-native-gesture-handler/jestSetup';
import { Provider } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import RootNavigator from '@navigation/RootNavigator';
import { createAppStore } from '@redux/Store';

const mockedRequest = jest.fn();

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));

jest.useFakeTimers();

const metrics = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

type Answer = () => Promise<unknown>;

const ok =
  (data: unknown): Answer =>
  () =>
    Promise.resolve({ data });

const refused =
  (status: number, code: string, headers: Record<string, string> = {}): Answer =>
  () =>
    Promise.reject({
      response: { status, data: { statusCode: status, code, message: code }, headers },
      config: { url: '/users/password-reset' },
    });

const lost: Answer = () => Promise.reject({ code: 'ERR_NETWORK', message: 'Network Error' });

const REQUESTED = ok({ message: 'Sent', resend_after_seconds: 60 });
const VERIFIED = ok({ reset_token: 'reset-token', expires_in_seconds: 600 });

// Each route answers with the next of its queued answers; a route with none left never answers.
const answer = (answers: Record<string, Answer[]>) =>
  mockedRequest.mockImplementation(({ url }: { url: string }) => {
    const next = answers[url.replace('/users/password-reset/', '')]?.shift();

    return next ? next() : new Promise(() => {});
  });

const settle = () => act(() => jest.advanceTimersByTimeAsync(1000));

const press = async (name: string) => {
  fireEvent.press(screen.getByRole('button', { name }));
  await settle();
};

const type = async (label: string, text: string) => {
  fireEvent.changeText(screen.getByLabelText(label), text);
  await settle();
};

const header = (name: string) => screen.queryByRole('header', { name });

const openSignIn = async () => {
  const store = createAppStore();

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>
        <RootNavigator />
      </Provider>
    </SafeAreaProvider>,
  );
  await settle();
  fireEvent.press(screen.getByText('Sign In'));
  await settle();

  return store;
};

const reachCode = async () => {
  const store = await openSignIn();

  await type('Email', 'anna@kovalenko.co');
  fireEvent.press(screen.getByText('Forgot password?'));
  await settle();
  await press('Send code');

  return store;
};

const reachNewPassword = async () => {
  const store = await reachCode();

  await type('6-digit code', '042917');
  await press('Next');

  return store;
};

const savePassword = async (password = 'sunny2026') => {
  await type('New password', password);
  await type('Confirm password', password);
  await press('Save new password');
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
});

it('runs from Forgot password to Sign In with the address carried both ways, without signing in', async () => {
  answer({ request: [REQUESTED], verify: [VERIFIED], complete: [ok(null)] });

  const store = await reachNewPassword();

  expect(header('Create a new password')).toBeTruthy();

  await savePassword();

  expect(mockedRequest.mock.calls.map(([config]) => [config.url, config.data])).toEqual([
    ['/users/password-reset/request', { email: 'anna@kovalenko.co' }],
    ['/users/password-reset/verify', { email: 'anna@kovalenko.co', code: '042917' }],
    ['/users/password-reset/complete', { reset_token: 'reset-token', password: 'sunny2026' }],
  ]);
  expect(header('Welcome back')).toBeTruthy();
  expect(screen.getByText('Password updated.')).toBeTruthy();
  expect(screen.getByLabelText('Email').props.value).toBe('anna@kovalenko.co');
  expect(screen.getByLabelText('Password').props.value).toBe('');
  expect(store.getState().passwordReset).toEqual({ email: null, resendAvailableAt: null, authorization: null });
  expect(store.getState().auth).toMatchObject({ isSignedIn: false, userToken: null, userEmail: null });
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

it('carries only a complete address from Sign In', async () => {
  await openSignIn();

  await type('Email', 'anna@kovalenko');
  fireEvent.press(screen.getByText('Forgot password?'));
  await settle();

  expect(screen.getByLabelText('Account email').props.value).toBe('');
});

it('ends the flow when it is left for Sign In', async () => {
  answer({ request: [REQUESTED] });

  const store = await reachCode();

  expect(store.getState().passwordReset.email).toBe('anna@kovalenko.co');

  fireEvent.press(screen.getByText('Sign In'));
  await settle();

  expect(header('Welcome back')).toBeTruthy();
  expect(store.getState().passwordReset).toEqual({ email: null, resendAvailableAt: null, authorization: null });
});

it('returns to the code without a new request while the same address’s cooldown runs, and drops it for another address', async () => {
  answer({ request: [REQUESTED, REQUESTED] });

  const store = await reachCode();

  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await settle();
  await press('Send code');

  expect(header('Check your email')).toBeTruthy();
  expect(mockedRequest).toHaveBeenCalledTimes(1);

  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await settle();
  await type('Account email', 'other@example.com');

  expect(store.getState().passwordReset.email).toBeNull();

  await press('Send code');

  expect(mockedRequest).toHaveBeenCalledTimes(2);
  expect(store.getState().passwordReset.email).toBe('other@example.com');
});

it('shows a refused request’s wait on the email screen and stays there', async () => {
  answer({ request: [refused(429, 'PASSWORD_RESET_RATE_LIMITED', { 'retry-after': '42' })] });

  await reachCode();

  expect(header('Reset password')).toBeTruthy();
  expect(screen.getByText('Too many attempts')).toBeTruthy();
  expect(screen.getByText(/Try again in 4\d seconds\./)).toBeTruthy();
});

it('keeps a wrong code on the field and lets the user retry', async () => {
  answer({ request: [REQUESTED], verify: [refused(400, 'PASSWORD_RESET_CODE_INVALID'), VERIFIED] });

  await reachCode();
  await type('6-digit code', '000000');
  await press('Next');

  expect(header('Check your email')).toBeTruthy();
  expect(screen.getByLabelText('6-digit code').props.accessibilityHint).toBe(
    'That code doesn’t match. Check the latest email.',
  );

  await type('6-digit code', '042917');
  await press('Next');

  expect(header('Create a new password')).toBeTruthy();
});

it('turns a used-up code into a request for a new one, available once the cooldown ends', async () => {
  answer({ request: [REQUESTED, REQUESTED], verify: [refused(400, 'PASSWORD_RESET_CODE_UNUSABLE')] });

  await reachCode();
  await type('6-digit code', '111111');
  await press('Next');

  expect(screen.getByText('This code no longer works')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Next' }).props.accessibilityState).toMatchObject({ disabled: true });
  expect(screen.getByRole('button', { name: 'Send again' }).props.accessibilityState).toMatchObject({
    disabled: true,
  });

  await act(() => jest.advanceTimersByTimeAsync(60_000));
  await press('Send again');

  expect(mockedRequest).toHaveBeenLastCalledWith(
    expect.objectContaining({ url: '/users/password-reset/request', data: { email: 'anna@kovalenko.co' } }),
  );
  expect(screen.queryByText('This code no longer works')).toBeNull();
});

it('keeps the code after a lost verify so Retry sends it again', async () => {
  answer({ request: [REQUESTED], verify: [lost, VERIFIED] });

  await reachCode();
  await type('6-digit code', '042917');
  await press('Next');

  expect(screen.getByText('Couldn’t reach the server')).toBeTruthy();
  expect(screen.getByLabelText('6-digit code').props.value).toBe('042917');

  await press('Retry');

  expect(header('Create a new password')).toBeTruthy();
});

it('discards the authorization when going back from the new password', async () => {
  answer({ request: [REQUESTED], verify: [VERIFIED] });

  const store = await reachNewPassword();

  expect(store.getState().passwordReset.authorization).not.toBeNull();

  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  await settle();

  expect(header('Check your email')).toBeTruthy();
  expect(store.getState().passwordReset.authorization).toBeNull();
  expect(store.getState().passwordReset.email).toBe('anna@kovalenko.co');
});

it('sends an expired authorization back to the code screen to request a new code', async () => {
  answer({
    request: [REQUESTED],
    verify: [VERIFIED],
    complete: [refused(400, 'PASSWORD_RESET_AUTHORIZATION_INVALID')],
  });

  await reachNewPassword();
  await savePassword();

  expect(header('Check your email')).toBeTruthy();
  expect(screen.getByText('Time to set a password ran out')).toBeTruthy();
});

it('checks the authorization’s expiry before sending the password', async () => {
  answer({ request: [REQUESTED], verify: [VERIFIED] });

  await reachNewPassword();
  await act(() => jest.advanceTimersByTimeAsync(600_000));
  await savePassword();

  expect(mockedRequest.mock.calls.map(([config]) => config.url)).not.toContain('/users/password-reset/complete');
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
  expect(mockedRequest.mock.calls.map(([config]) => config.url)).not.toContain('/users/password-reset/complete');
});
