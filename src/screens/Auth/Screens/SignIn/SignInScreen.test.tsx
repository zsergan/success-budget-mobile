import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { login } from '@api/auth.api';
import { createAppStore } from '@redux/Store';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import SignInScreen from './SignInScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('expo-secure-store');
jest.mock('@api/auth.api', () => ({
  ...jest.requireActual('@api/auth.api'),
  login: jest.fn(),
}));

const mockedAddAlert = jest.fn();

jest.mock('@hooks', () => ({
  useAlert: () => ({ addAlert: mockedAddAlert }),
}));

const mockedLogin = jest.mocked(login);

const rejectWith = (status: number, body?: object, headers: Record<string, string> = {}) =>
  mockedLogin.mockRejectedValue({ response: { status, data: body, headers }, config: { url: '/users/login' } });

const rejectWithoutAnswer = () => mockedLogin.mockRejectedValue({ code: 'ERR_NETWORK', message: 'Network Error' });

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const renderSignIn = () => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={createAppStore()}>
        <SignInScreen {...({ navigation, route: {} } as unknown as RootStackScreenProps<ScreenNames.SIGN_IN_SCREEN>)} />
      </Provider>
    </SafeAreaProvider>,
  );

  return { navigation };
};

const signInButton = () => screen.getByRole('button', { name: 'Sign In' });

const fillIn = async (email: string, password: string) => {
  await act(async () => {
    fireEvent.changeText(screen.getByLabelText('Email'), email);
    fireEvent.changeText(screen.getByLabelText('Password'), password);
  });
};

beforeEach(() => jest.clearAllMocks());

it('keeps Sign In off until the form is filled in correctly', async () => {
  renderSignIn();

  expect(signInButton().props.accessibilityState).toMatchObject({ disabled: true });

  await fillIn('anna@kovalenko.co', '');
  expect(signInButton().props.accessibilityState).toMatchObject({ disabled: true });

  await fillIn('anna.kovalenko.co', 'secret1');
  expect(signInButton().props.accessibilityState).toMatchObject({ disabled: true });

  await fillIn('anna@kovalenko.co', 'secret1');
  expect(signInButton().props.accessibilityState).toMatchObject({ disabled: false });
});

it('accepts a password made under the older sign-up rule', async () => {
  renderSignIn();

  await fillIn('anna@kovalenko.co', 'abcdef');

  expect(signInButton().props.accessibilityState).toMatchObject({ disabled: false });
});

it('sends one request however often Sign In is pressed while it is pending', async () => {
  mockedLogin.mockReturnValue(new Promise(() => {}));
  renderSignIn();

  await fillIn('anna@kovalenko.co', 'secret1');
  await act(async () => {
    fireEvent.press(signInButton());
    fireEvent.press(signInButton());
  });

  expect(mockedLogin).toHaveBeenCalledTimes(1);
  expect(mockedLogin).toHaveBeenCalledWith({ email: 'anna@kovalenko.co', password: 'secret1' });
  expect(signInButton().props.accessibilityState).toMatchObject({ busy: true });
});

it('opens Sign Up from Create account', () => {
  const { navigation } = renderSignIn();

  fireEvent.press(screen.getByText('Create account'));

  expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.SIGN_UP_SCREEN, undefined, { pop: true });
});

const submit = async (email = 'anna@kovalenko.co', password = 'secret1') => {
  await fillIn(email, password);
  await act(async () => fireEvent.press(signInButton()));
};

// The press returns the pending submit, which act would otherwise wait for.
const submitWithoutWaiting = async () => {
  await fillIn('anna@kovalenko.co', 'secret1');
  await act(async () => {
    fireEvent.press(signInButton());
  });
};

describe('a failed sign-in', () => {
  it('marks the email and explains wrong credentials in place, without an alert', async () => {
    rejectWith(401, { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    renderSignIn();

    await submit();

    expect(screen.getByText('Wrong email or password')).toBeTruthy();
    expect(screen.getByText('No account matches this email and password.')).toBeTruthy();
    expect(screen.queryByText(/attempts left/)).toBeNull();
    expect(mockedAddAlert).not.toHaveBeenCalled();
  });

  it('drops the wrong-credentials message once either field changes', async () => {
    rejectWith(401, { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    renderSignIn();

    await submit();
    await act(async () => fireEvent.changeText(screen.getByLabelText('Password'), 'secret12'));

    expect(screen.queryByText('Wrong email or password')).toBeNull();
    expect(screen.queryByText('No account matches this email and password.')).toBeNull();
  });

  it('ignores wrong credentials for a password edited while the request was pending', async () => {
    let answer: (error: object) => void = () => {};
    mockedLogin.mockReturnValue(new Promise((_, reject) => (answer = reject)));
    renderSignIn();

    await submitWithoutWaiting();
    await act(async () => fireEvent.changeText(screen.getByLabelText('Password'), 'secret12'));
    await act(async () => answer({ response: { status: 401, data: {}, headers: {} }, config: {} }));

    expect(screen.queryByText('Wrong email or password')).toBeNull();
    expect(screen.queryByText('No account matches this email and password.')).toBeNull();
    expect(screen.getByLabelText('Password').props.value).toBe('secret12');
    expect(signInButton().props.accessibilityState).toMatchObject({ disabled: false, busy: false });

    rejectWith(401, { statusCode: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    await act(async () => fireEvent.press(signInButton()));

    expect(mockedLogin).toHaveBeenLastCalledWith({ email: 'anna@kovalenko.co', password: 'secret12' });
    expect(screen.getByText('Wrong email or password')).toBeTruthy();
  });

  it('still shows a lost connection that answers after the form was edited', async () => {
    let answer: (error: object) => void = () => {};
    mockedLogin.mockReturnValue(new Promise((_, reject) => (answer = reject)));
    renderSignIn();

    await submitWithoutWaiting();
    await act(async () => fireEvent.changeText(screen.getByLabelText('Email'), 'anna@kovalenko.com'));
    await act(async () => answer({ code: 'ERR_NETWORK', message: 'Network Error' }));

    expect(screen.getByText('Couldn’t reach the server')).toBeTruthy();
  });

  it('keeps what was typed when the server is unreachable, and Retry sends the form as it is now', async () => {
    rejectWithoutAnswer();
    renderSignIn();

    await submit();

    expect(screen.getByText('Couldn’t reach the server')).toBeTruthy();
    expect(screen.queryByText('No account matches this email and password.')).toBeNull();
    expect(screen.getByLabelText('Email').props.value).toBe('anna@kovalenko.co');

    mockedLogin.mockClear();
    await act(async () => fireEvent.changeText(screen.getByLabelText('Email'), 'anna@kovalenko.com'));
    await act(async () => fireEvent.press(screen.getByRole('button', { name: 'Retry' })));

    expect(mockedLogin).toHaveBeenCalledWith({ email: 'anna@kovalenko.com', password: 'secret1' });
    expect(mockedAddAlert).not.toHaveBeenCalled();
  });

  it('tells a server failure apart from a lost connection', async () => {
    rejectWith(503);
    renderSignIn();

    await submit();

    expect(screen.getByText('Something went wrong on our side')).toBeTruthy();
    expect(screen.queryByText('Couldn’t reach the server')).toBeNull();
  });

  it('asks to wait for as long as the server says after too many attempts', async () => {
    rejectWith(429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }, { 'retry-after': '42' });
    renderSignIn();

    await submit();

    expect(screen.getByText('Too many sign-in attempts')).toBeTruthy();
    expect(screen.getByText('Try again in 42 seconds.')).toBeTruthy();
  });

  it('counts the wait down, and says when another attempt is allowed', async () => {
    jest.useFakeTimers();
    try {
      rejectWith(429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }, { 'retry-after': '42' });
      renderSignIn();

      await submit();
      await act(async () => jest.advanceTimersByTime(30_000));

      expect(screen.getByText('Try again in 12 seconds.')).toBeTruthy();

      await act(async () => jest.advanceTimersByTime(11_000));

      expect(screen.getByText('Try again in 1 second.')).toBeTruthy();

      await act(async () => jest.advanceTimersByTime(1_000));

      expect(screen.getByText('You can try again now.')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('starts a new wait from its own refusal, not the earlier one', async () => {
    jest.useFakeTimers();
    try {
      rejectWith(429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }, { 'retry-after': '5' });
      renderSignIn();

      await submit();
      await act(async () => jest.advanceTimersByTime(10_000));
      expect(screen.getByText('You can try again now.')).toBeTruthy();

      rejectWith(429, { statusCode: 429, message: 'ThrottlerException: Too Many Requests' }, { 'retry-after': '20' });
      await act(async () => fireEvent.press(signInButton()));

      expect(screen.getByText('Try again in 20 seconds.')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows the server’s reason for any other refusal', async () => {
    rejectWith(403, { statusCode: 403, code: 'EMAIL_NOT_VERIFIED', message: 'Email is not verified' });
    renderSignIn();

    await submit();

    expect(screen.getByText('Couldn’t sign you in')).toBeTruthy();
    expect(screen.getByText('Email is not verified')).toBeTruthy();
  });

  it('keeps an unverified email’s refusal through a password edit and drops it for another email', async () => {
    rejectWith(403, { statusCode: 403, code: 'EMAIL_NOT_VERIFIED', message: 'Email is not verified' });
    renderSignIn();

    await submit();
    await act(async () => fireEvent.changeText(screen.getByLabelText('Password'), 'secret12'));

    expect(screen.getByText('Email is not verified')).toBeTruthy();

    await act(async () => fireEvent.changeText(screen.getByLabelText('Email'), 'anna@kovalenko.com'));

    expect(screen.queryByText('Couldn’t sign you in')).toBeNull();
  });

  it('drops any other refusal once either field changes', async () => {
    rejectWith(400, { statusCode: 400, code: 'VALIDATION_FAILED', message: 'email must be an email' });
    renderSignIn();

    await submit();
    await act(async () => fireEvent.changeText(screen.getByLabelText('Password'), 'secret12'));

    expect(screen.queryByText('Couldn’t sign you in')).toBeNull();
  });

  it('keeps a lost connection’s banner while the form is edited', async () => {
    rejectWithoutAnswer();
    renderSignIn();

    await submit();
    await act(async () => fireEvent.changeText(screen.getByLabelText('Email'), 'anna@kovalenko.com'));

    expect(screen.getByText('Couldn’t reach the server')).toBeTruthy();
  });
});
