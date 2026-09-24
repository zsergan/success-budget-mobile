import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { verifyEmail } from '@api/auth.api';
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

const mockedAddAlert = jest.fn();

jest.mock('@hooks', () => ({
  useAlert: () => ({ addAlert: mockedAddAlert }),
}));

const mockedVerifyEmail = jest.mocked(verifyEmail);

const rejectWith = (message: string, statusCode: number) =>
  mockedVerifyEmail.mockRejectedValue({
    response: { data: { message, statusCode, path: '/users/verify-email', timestamp: '2026-01-01T00:00:00.000Z' } },
  });

const submitCode = () => {
  const store = createAppStore();
  const navigation = { navigate: jest.fn() };

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

beforeEach(() => jest.clearAllMocks());

it('sends an already verified account to sign in instead of asking for the code again', async () => {
  rejectWith('Email is already verified', 409);

  const { navigation } = submitCode();

  await waitFor(() =>
    expect(navigation.navigate).toHaveBeenCalledWith(ScreenNames.SIGN_IN_SCREEN, undefined, { pop: true }),
  );
  expect(mockedAddAlert).toHaveBeenCalledTimes(1);
  expect(mockedAddAlert).toHaveBeenCalledWith('This email is already verified. Sign in to continue.');
});

it('keeps the user on the code screen for a wrong code', async () => {
  rejectWith('Invalid credentials', 400);

  const { navigation } = submitCode();

  await waitFor(() => expect(mockedAddAlert).toHaveBeenCalledWith('Invalid credentials'));
  expect(navigation.navigate).not.toHaveBeenCalled();
});
