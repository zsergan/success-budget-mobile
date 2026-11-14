import { Text } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import * as SecureStore from 'expo-secure-store';

import { verifyEmail } from '@api/auth.api';
import { createToastRecorder } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { registerMe } from '@redux/state/auth/thunks';
import { AUTH_TOKEN_KEY } from '@shared/constants';
import { ScreenNames } from '@shared/enums';
import type { RootStackParamList } from '@shared/types';
import VerifyEmailScreen from './VerifyEmailScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('expo-secure-store');
jest.mock('expo-clipboard', () => ({ getStringAsync: jest.fn() }));
jest.mock('@api/auth.api', () => ({
  ...jest.requireActual('@api/auth.api'),
  verifyEmail: jest.fn(),
}));

const mockToasts = createToastRecorder();

jest.mock('@hooks', () => ({
  ...jest.requireActual('@hooks'),
  useToast: () => mockToasts.toast,
}));

const mockedVerifyEmail = jest.mocked(verifyEmail);
const mockedSetItemAsync = jest.mocked(SecureStore.setItemAsync);

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

// The API's error body, with the code the backend sends for this status.
const rejection = (statusCode: number, code: string, message: string, headers: Record<string, string> = {}) => ({
  response: {
    status: statusCode,
    headers,
    data: { code, message, statusCode, path: '/users/verify-email', timestamp: '2026-01-01T00:00:00.000Z' },
  },
});

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Placeholder = () => <Text>Another screen</Text>;

const routes = () =>
  (navigationRef.getRootState()?.routes ?? []).map(({ name, params }) => (params ? { name, params } : name));

const SIGN_UP = ScreenNames.SIGN_UP_SCREEN;
const VERIFY_EMAIL = ScreenNames.VERIFY_EMAIL_SCREEN;
const SIGN_IN = ScreenNames.SIGN_IN_SCREEN;

const renderVerifyEmail = async ({ email = 'anna@kovalenko.co' as string | null } = {}) => {
  const store = createAppStore();

  if (email !== null) {
    store.dispatch(registerMe.pending('req-register', {} as never));
    store.dispatch(registerMe.fulfilled({ email }, 'req-register', {} as never));
  }

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>
        <NavigationContainer
          ref={navigationRef}
          initialState={{ index: 1, routes: [{ name: SIGN_UP }, { name: VERIFY_EMAIL }] }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={SIGN_UP} component={Placeholder} />
            <Stack.Screen name={SIGN_IN} component={Placeholder} />
            <Stack.Screen name={VERIFY_EMAIL} component={VerifyEmailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    </SafeAreaProvider>,
  );
  await act(async () => {});

  return { store };
};

// What the system Back and the iOS edge swipe ask the navigator for.
const goBack = () => act(async () => navigationRef.goBack());

// Sign In opens over the screen and closes again: the screen was left, yet it is still there to come back to.
const leaveAndReturn = async () => {
  await act(async () => navigationRef.navigate(SIGN_IN));
  await goBack();
};

const codeField = () => screen.getByLabelText('6-digit code');
const button = (name: string) => screen.getByRole('button', { name });
const isDisabled = (name: string) => button(name).props.accessibilityState?.disabled === true;

const enterCode = (text: string) => act(async () => void fireEvent.changeText(codeField(), text));
const press = (name: string) => act(async () => void fireEvent.press(button(name)));

const submitCode = async (code: string) => {
  await enterCode(code);
  await press('Verify email');
};

beforeEach(() => {
  jest.resetAllMocks();
  mockToasts.clear();
});

describe('code entry', () => {
  it('shows where the code went and keeps Verify email off until six digits are in', async () => {
    await renderVerifyEmail();

    expect(screen.getByRole('header', { name: 'Check your email' })).toBeTruthy();
    expect(screen.getByText('anna@kovalenko.co')).toBeTruthy();
    expect(isDisabled('Verify email')).toBe(true);

    await enterCode('04291');
    expect(isDisabled('Verify email')).toBe(true);

    await enterCode('042917');
    expect(isDisabled('Verify email')).toBe(false);
  });

  it('keeps leading zeros and drops anything that isn’t a digit, as autofill may bring', async () => {
    mockedVerifyEmail.mockReturnValue(new Promise(() => {}));
    await renderVerifyEmail();

    await submitCode('00 12-3a4');

    expect(codeField().props.value).toBe('001234');
    expect(mockedVerifyEmail).toHaveBeenCalledWith({ email: 'anna@kovalenko.co', code: '001234' });
  });

  it('fills every box from the Paste button', async () => {
    jest.mocked(Clipboard.getStringAsync).mockResolvedValue('Your code: 482 913');
    await renderVerifyEmail();

    await press('Paste code');

    expect(codeField().props.value).toBe('482913');
    expect(screen.getByText('Pasted from clipboard.')).toBeTruthy();
    expect(isDisabled('Verify email')).toBe(false);
  });

  it('sends the code once however often Verify email is pressed, and holds it meanwhile', async () => {
    mockedVerifyEmail.mockReturnValue(new Promise(() => {}));
    await renderVerifyEmail();
    await enterCode('042917');

    await act(async () => {
      fireEvent.press(button('Verify email'));
      fireEvent.press(button('Verify email'));
    });

    expect(mockedVerifyEmail).toHaveBeenCalledTimes(1);
    expect(button('Checking…').props.accessibilityState).toMatchObject({ busy: true });
    expect(codeField().props.editable).toBe(false);
    expect(isDisabled('Change email')).toBe(true);
    expect(isDisabled('Request another code')).toBe(true);
  });

  it('empties the field when the screen is left', async () => {
    await renderVerifyEmail();
    await enterCode('042917');

    await leaveAndReturn();

    expect(codeField().props.value).toBe('');
  });
});

describe('going back to Sign Up', () => {
  it('returns from Back', async () => {
    await renderVerifyEmail();

    await press('Back');

    expect(routes()).toEqual([SIGN_UP]);
  });

  it('returns to the email field from Change', async () => {
    await renderVerifyEmail();

    await press('Change email');

    expect(routes()).toEqual([{ name: SIGN_UP, params: { focusEmail: true } }]);
  });

  it('returns to request another email, promising neither a new code nor a wait', async () => {
    await renderVerifyEmail();

    expect(screen.getByText('No email? Check spam, or request another code.')).toBeTruthy();

    await press('Request another code');

    expect(routes()).toEqual([{ name: SIGN_UP, params: { notice: 'requestAnotherCode' } }]);
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });

  it('returns at once, asking the server nothing, when no address is waiting for a code', async () => {
    await renderVerifyEmail({ email: null });

    expect(routes()).toEqual([SIGN_UP]);
    expect(screen.queryByLabelText('6-digit code')).toBeNull();
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });
});

describe('a code the server refuses', () => {
  it('keeps a wrong code under the field until it is edited', async () => {
    mockedVerifyEmail.mockRejectedValue(rejection(400, 'INVALID_CREDENTIALS', 'Invalid credentials'));
    await renderVerifyEmail();

    await submitCode('123456');

    expect(screen.getByText('That code doesn’t match. Check the email and try again.')).toBeTruthy();
    expect(codeField().props.value).toBe('123456');
    expect(isDisabled('Verify email')).toBe(true);
    expect(routes()).toEqual([SIGN_UP, VERIFY_EMAIL]);
    expect(mockToasts.shown).toEqual([]);

    await enterCode('12345');

    expect(screen.queryByText('That code doesn’t match. Check the email and try again.')).toBeNull();
  });

  it.each([
    ['a missing or expired code', rejection(404, 'NOT_FOUND', 'Not found'), 'This code no longer works'],
    [
      'exhausted attempts',
      rejection(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts, request a new confirmation code'),
      'Too many wrong attempts',
    ],
  ])('leads to Request another code after %s', async (_name, answer, title) => {
    mockedVerifyEmail.mockRejectedValue(answer);
    await renderVerifyEmail();

    await submitCode('123456');

    expect(screen.getByText(title)).toBeTruthy();
    expect(codeField().props).toMatchObject({ editable: false, value: '' });
    expect(screen.queryByRole('button', { name: 'Verify email' })).toBeNull();

    await press('Request another code');

    expect(routes()).toEqual([{ name: SIGN_UP, params: { notice: 'requestAnotherCode' } }]);
    expect(mockedVerifyEmail).toHaveBeenCalledTimes(1);
  });

  it('waits out a request throttle for as long as Retry-After says, keeping the code', async () => {
    mockedVerifyEmail.mockRejectedValue(
      rejection(429, 'TOO_MANY_REQUESTS', 'ThrottlerException: Too Many Requests', { 'retry-after': '30' }),
    );
    await renderVerifyEmail();

    await submitCode('123456');

    expect(screen.getByText('Too many attempts')).toBeTruthy();
    expect(screen.getByText(/^Try again in (30|29) seconds\.$/)).toBeTruthy();
    expect(codeField().props.value).toBe('123456');
    expect(isDisabled('Verify email')).toBe(true);
  });

  it('sends an already verified account to sign in instead of asking for the code again', async () => {
    mockedVerifyEmail.mockRejectedValue(rejection(409, 'EMAIL_ALREADY_VERIFIED', 'Email is already verified'));
    await renderVerifyEmail();

    await submitCode('123456');

    expect(routes()).toEqual([SIGN_UP, VERIFY_EMAIL, SIGN_IN]);
    // One message, on Sign In, and no error for the refusal that led there.
    expect(mockToasts.shown).toEqual([
      {
        when: 'afterNavigation',
        message: { tone: 'info', text: 'This email is already verified. Sign in to continue.' },
      },
    ]);
    expect(screen.queryByText('Email is already verified')).toBeNull();
  });
});

describe('a request that fails', () => {
  it.each([
    ['the network', { code: 'ERR_NETWORK', message: 'Network Error' }, 'Couldn’t reach the server', 'Retry'],
    [
      'the service',
      rejection(503, 'SERVICE_UNAVAILABLE', 'Service Unavailable'),
      'Verification is temporarily unavailable',
      'Try again',
    ],
  ])('keeps the code after a failure of %s and sends it again on retry', async (_name, answer, title, retry) => {
    mockedVerifyEmail.mockRejectedValueOnce(answer).mockReturnValue(new Promise(() => {}));
    await renderVerifyEmail();

    await submitCode('042917');

    expect(screen.getByText(title)).toBeTruthy();
    expect(codeField().props.value).toBe('042917');
    expect(isDisabled('Verify email')).toBe(false);

    await press(retry);

    expect(mockedVerifyEmail).toHaveBeenCalledTimes(2);
    expect(mockedVerifyEmail).toHaveBeenLastCalledWith({ email: 'anna@kovalenko.co', code: '042917' });
  });
});

describe('signing in', () => {
  const held = () => {
    let settle: (token: string) => void = () => {};
    mockedVerifyEmail.mockReturnValueOnce(new Promise<string>((resolve) => (settle = resolve)));

    return (token: string) => act(async () => settle(token));
  };

  it('signs in with the token the server gave for the code', async () => {
    mockedVerifyEmail.mockResolvedValue('a-token');
    const { store } = await renderVerifyEmail();

    await submitCode('042917');

    expect(mockedSetItemAsync).toHaveBeenCalledWith(AUTH_TOKEN_KEY, 'a-token');
    expect(store.getState().auth).toMatchObject({ isSignedIn: true, userToken: 'a-token' });
  });

  it('lets the user go back while the server is asked, and then neither saves a token nor signs in', async () => {
    const answer = held();
    const { store } = await renderVerifyEmail();
    await submitCode('042917');

    await goBack();

    expect(routes()).toEqual([SIGN_UP]);

    await answer('a-token');

    expect(mockedSetItemAsync).not.toHaveBeenCalled();
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(routes()).toEqual([SIGN_UP]);
    expect(mockToasts.shown).toEqual([]);
  });

  it('neither saves a token nor signs in when the code is accepted while another screen is open', async () => {
    const answer = held();
    const { store } = await renderVerifyEmail();
    await submitCode('042917');

    await leaveAndReturn();
    await answer('a-token');

    expect(mockedSetItemAsync).not.toHaveBeenCalled();
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(routes()).toEqual([SIGN_UP, VERIFY_EMAIL]);
    expect(mockToasts.shown).toEqual([]);
    expect(isDisabled('Verify email')).toBe(true);
    expect(codeField().props).toMatchObject({ editable: true, value: '' });
  });

  it('acts only on the new attempt when an older one answers during it', async () => {
    const answerOlder = held();
    const answerNewer = held();
    const { store } = await renderVerifyEmail();
    await submitCode('111111');
    await leaveAndReturn();
    await submitCode('222222');

    await answerOlder('older-token');

    expect(mockedSetItemAsync).not.toHaveBeenCalled();
    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(button('Checking…').props.accessibilityState).toMatchObject({ busy: true });

    await answerNewer('newer-token');

    expect(mockedSetItemAsync).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.userToken).toBe('newer-token');
  });

  const heldSave = () => {
    let succeed: () => void = () => {};
    let fail: (error: Error) => void = () => {};
    mockedVerifyEmail.mockResolvedValue('a-token');
    mockedSetItemAsync.mockReturnValueOnce(
      new Promise<void>((resolve, reject) => {
        succeed = resolve;
        fail = reject;
      }),
    );

    return {
      succeed: () => act(async () => succeed()),
      fail: () => act(async () => fail(new Error('keychain unavailable'))),
    };
  };

  const tryToLeave = async () => {
    await goBack();
    await press('Back');
    await press('Change email');
    await act(async () => void fireEvent.press(screen.getByText('Sign In')));
  };

  it('holds the screen while the token is saved, so the session is never half made', async () => {
    const save = heldSave();
    const { store } = await renderVerifyEmail();
    await submitCode('042917');

    await tryToLeave();

    expect(routes()).toEqual([SIGN_UP, VERIFY_EMAIL]);
    expect(store.getState().auth.isSignedIn).toBe(false);

    await save.succeed();

    expect(store.getState().auth).toMatchObject({ isSignedIn: true, userToken: 'a-token' });
    expect(mockedSetItemAsync).toHaveBeenCalledTimes(1);
    expect(routes()).toEqual([SIGN_UP, VERIFY_EMAIL]);
  });

  it('sends a verified user to sign in when this device can’t save the session', async () => {
    const save = heldSave();
    const { store } = await renderVerifyEmail();
    await submitCode('042917');

    await tryToLeave();

    expect(routes()).toEqual([SIGN_UP, VERIFY_EMAIL]);

    await save.fail();

    expect(store.getState().auth.isSignedIn).toBe(false);
    expect(routes()).toEqual([SIGN_UP, VERIFY_EMAIL, SIGN_IN]);
    expect(mockToasts.shown).toEqual([
      { when: 'afterNavigation', message: { tone: 'info', text: 'Your email is verified. Sign in to continue.' } },
    ]);
  });
});
