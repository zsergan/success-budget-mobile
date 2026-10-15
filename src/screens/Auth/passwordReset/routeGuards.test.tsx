import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render, screen } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { passwordResetApi } from '@redux/state/passwordReset/api';
import { ScreenNames } from '@shared/enums';
import type { RootStackScreenProps } from '@shared/types';
import NewPasswordScreen from '@screens/Auth/Screens/NewPassword/NewPasswordScreen';
import ResetCodeScreen from '@screens/Auth/Screens/ResetCode/ResetCodeScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

beforeEach(() => jest.clearAllMocks());

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const renderScreen = <T extends ScreenNames.RESET_CODE_SCREEN | ScreenNames.NEW_PASSWORD_SCREEN>(
  Screen: (props: RootStackScreenProps<T>) => React.ReactNode,
  store = createAppStore(),
) => {
  const navigation = { navigate: jest.fn(), goBack: jest.fn(), popTo: jest.fn(), setParams: jest.fn() };

  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>
        <Screen {...({ navigation, route: {} } as unknown as RootStackScreenProps<T>)} />
      </Provider>
    </SafeAreaProvider>,
  );

  return { navigation };
};

const withChallenge = async () => {
  const store = createAppStore();

  mockedRequest.mockResolvedValueOnce({ data: { message: 'Sent', resend_after_seconds: 60 } });
  await store.dispatch(
    passwordResetApi.endpoints.requestPasswordReset.initiate({ email: 'anna@kovalenko.co' }, { track: false }),
  );

  return store;
};

it('opens the code screen only for a requested code', () => {
  const { navigation } = renderScreen(ResetCodeScreen);

  expect(navigation.popTo).toHaveBeenCalledWith(ScreenNames.FORGOT_PASSWORD_SCREEN);
  expect(screen.queryByLabelText('6-digit code')).toBeNull();
});

it('opens the code screen once a code was requested', async () => {
  const { navigation } = renderScreen(ResetCodeScreen, await withChallenge());

  expect(navigation.popTo).not.toHaveBeenCalled();
  expect(screen.getByLabelText('6-digit code')).toBeTruthy();
});

it('opens the new password only with a reset authorization', async () => {
  const { navigation } = renderScreen(NewPasswordScreen, await withChallenge());

  expect(navigation.popTo).toHaveBeenCalledWith(ScreenNames.RESET_CODE_SCREEN);
  expect(screen.queryByLabelText('New password')).toBeNull();
});
