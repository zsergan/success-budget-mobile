import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import { verifyEmail } from '@api/auth.api';
import { createToastRecorder } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { registerMe } from '@redux/state/auth/thunks';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
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

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const rejection = (message: string, statusCode: number) => ({
  response: {
    status: statusCode,
    data: { message, statusCode, path: '/users/verify-email', timestamp: '2026-01-01T00:00:00.000Z' },
  },
});

const renderVerifyEmail = async ({ email = 'anna@kovalenko.co' as string | null } = {}) => {
  const store = createAppStore();
  const listeners: Record<string, () => void> = {};
  const navigation = {
    navigate: jest.fn(),
    popTo: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn((event: string, listener: () => void) => {
      listeners[event] = listener;

      return () => delete listeners[event];
    }),
  };

  if (email !== null) {
    store.dispatch(registerMe.pending('req-register', {} as never));
    store.dispatch(registerMe.fulfilled({ email }, 'req-register', {} as never));
  }

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>
        <VerifyEmailScreen
          {...({ navigation, route: {} } as unknown as RootStackScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN>)}
        />
      </Provider>
    </SafeAreaProvider>,
  );
  await act(async () => {});

  return { navigation, store, blur: () => act(async () => listeners.blur()) };
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
  jest.clearAllMocks();
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
    const { blur } = await renderVerifyEmail();
    await enterCode('042917');

    await blur();

    expect(codeField().props.value).toBe('');
  });
});

describe('going back to Sign Up', () => {
  it('returns from Back', async () => {
    const { navigation } = await renderVerifyEmail();

    await press('Back');

    expect(navigation.popTo).toHaveBeenCalledWith(ScreenNames.SIGN_UP_SCREEN);
  });

  it('returns to the email field from Change', async () => {
    const { navigation } = await renderVerifyEmail();

    await press('Change email');

    expect(navigation.popTo).toHaveBeenCalledWith(ScreenNames.SIGN_UP_SCREEN, { focusEmail: true });
  });

  it('returns to request another email, promising neither a new code nor a wait', async () => {
    const { navigation } = await renderVerifyEmail();

    expect(screen.getByText('No email? Check spam, or request another code.')).toBeTruthy();

    await press('Request another code');

    expect(navigation.popTo).toHaveBeenCalledWith(ScreenNames.SIGN_UP_SCREEN, { notice: 'requestAnotherCode' });
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });

  it('returns at once, asking the server nothing, when no address is waiting for a code', async () => {
    const { navigation } = await renderVerifyEmail({ email: null });

    expect(navigation.popTo).toHaveBeenCalledWith(ScreenNames.SIGN_UP_SCREEN);
    expect(screen.queryByLabelText('6-digit code')).toBeNull();
    expect(mockedVerifyEmail).not.toHaveBeenCalled();
  });
});

describe('the answer', () => {
  it('sends an already verified account to sign in instead of asking for the code again', async () => {
    mockedVerifyEmail.mockRejectedValue(rejection('Email is already verified', 409));
    const { navigation } = await renderVerifyEmail();

    await submitCode('123456');

    expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true });
    // One message, on Sign In, and no error for the refusal that led there.
    expect(mockToasts.shown).toEqual([
      {
        when: 'afterNavigation',
        message: { tone: 'info', text: 'This email is already verified. Sign in to continue.' },
      },
    ]);
    expect(screen.queryByText('Email is already verified')).toBeNull();
  });

  it('keeps a wrong code under the field until it is edited', async () => {
    mockedVerifyEmail.mockRejectedValue(rejection('Invalid credentials', 400));
    const { navigation } = await renderVerifyEmail();

    await submitCode('123456');

    expect(screen.getByText('Invalid credentials')).toBeTruthy();
    expect(codeField().props.value).toBe('123456');
    expect(isDisabled('Verify email')).toBe(true);
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(mockToasts.shown).toEqual([]);

    await enterCode('12345');

    expect(screen.queryByText('Invalid credentials')).toBeNull();
  });

  it('does nothing with an answer that comes after the user left', async () => {
    let answer: (reason: unknown) => void = () => {};
    mockedVerifyEmail.mockReturnValue(new Promise((_, reject) => (answer = reject)));
    const { navigation } = await renderVerifyEmail();

    await submitCode('123456');
    navigation.isFocused.mockReturnValue(false);
    await act(async () => answer(rejection('Email is already verified', 409)));

    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(mockToasts.shown).toEqual([]);
  });
});
