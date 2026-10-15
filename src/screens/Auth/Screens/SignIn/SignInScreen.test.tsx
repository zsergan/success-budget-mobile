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

jest.mock('@hooks', () => ({
  useAlert: () => ({ addAlert: jest.fn() }),
}));

const mockedLogin = jest.mocked(login);

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
