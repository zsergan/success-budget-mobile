import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

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

const rejectWith = (message: string, statusCode: number) =>
  mockedVerifyEmail.mockRejectedValue({
    response: {
      status: statusCode,
      data: { message, statusCode, path: '/users/verify-email', timestamp: '2026-01-01T00:00:00.000Z' },
    },
  });

const submitCode = () => {
  const store = createAppStore();
  const navigation = { navigate: jest.fn(), isFocused: jest.fn(() => true) };

  store.dispatch(registerMe.fulfilled({ email: 'a@b.com' }, 'req-register', {} as never));

  render(
    <Provider store={store}>
      <VerifyEmailScreen
        {...({ navigation, route: {} } as unknown as RootStackScreenProps<ScreenNames.VERIFY_EMAIL_SCREEN>)}
      />
    </Provider>,
  );

  fireEvent.changeText(screen.getByPlaceholderText('000000'), '123456');
  // The heading reads the same as the button, which comes second.
  const [, submitButton] = screen.getAllByText('Verify Email');

  fireEvent.press(submitButton);

  return { navigation };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockToasts.clear();
});

it('sends an already verified account to sign in instead of asking for the code again', async () => {
  rejectWith('Email is already verified', 409);

  const { navigation } = submitCode();

  await waitFor(() =>
    expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true }),
  );
  // One message, on Sign In, and no error for the refusal that led there.
  expect(mockToasts.shown).toEqual([
    {
      when: 'afterNavigation',
      message: { tone: 'info', text: 'This email is already verified. Sign in to continue.' },
    },
  ]);
  expect(screen.queryByText('Email is already verified')).toBeNull();
});

it('keeps the user on the code screen for a wrong code', async () => {
  rejectWith('Invalid credentials', 400);

  const { navigation } = submitCode();

  // Under the code it is about, which stays as typed.
  await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeTruthy());
  expect(screen.getByPlaceholderText('000000').props.value).toBe('123456');
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(mockToasts.shown).toEqual([]);
});

it('does nothing with an answer that comes after the user left', async () => {
  let answer: (reason: unknown) => void = () => {};
  mockedVerifyEmail.mockReturnValue(new Promise((_, reject) => (answer = reject)));

  const { navigation } = submitCode();
  navigation.isFocused.mockReturnValue(false);
  answer({ response: { status: 409, data: { message: 'Email is already verified', statusCode: 409 } } });

  await waitFor(() => expect(mockedVerifyEmail).toHaveBeenCalled());
  await new Promise((resolve) => setImmediate(resolve));
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(mockToasts.shown).toEqual([]);
});
