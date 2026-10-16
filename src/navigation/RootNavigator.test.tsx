import 'react-native-gesture-handler/jestSetup';
import { Provider } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@components';
import { THEME_RESTORE_TIMEOUT_MS } from '@components/ThemeProvider/ThemeProvider';
import { THEME_PREFERENCE_KEY } from '@shared/constants';
import { loginMe } from '@redux/state/auth/thunks';
import { createAppStore } from '@redux/Store';
import RootNavigator from './RootNavigator';

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

const renderApp = async () => {
  const store = createAppStore();

  render(
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={metrics}>
        <Provider store={store}>
          <RootNavigator />
        </Provider>
      </SafeAreaProvider>
    </ThemeProvider>,
  );
  await act(() => jest.advanceTimersByTimeAsync(0));

  return store;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockImplementation(() => new Promise(() => {}));
});

it('shows only the launch screen while a stored session is being checked, never the sign-in screens beside it', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('a-token');

  await renderApp();

  expect(screen.getByRole('header', { name: 'Success Budget. Personal and shared budgets' })).toBeTruthy();
  expect(screen.queryByText('See where the money goes')).toBeNull();
  expect(screen.queryByText('Sign In')).toBeNull();
});

it('opens Welcome straight away without a stored session, and Sign In leads to the sign-in form', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

  await renderApp();

  expect(screen.getByText('See where the money goes')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(mockedRequest).not.toHaveBeenCalled();

  fireEvent.press(screen.getByText('Sign In'));
  await act(() => jest.advanceTimersByTimeAsync(1000));
  expect(screen.getByText('No account yet?')).toBeTruthy();
});

it('loads the required data after a sign-in from Welcome before opening the app', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

  const store = await renderApp();
  const { attempt } = store.getState().launch;

  await act(async () => {
    store.dispatch(loginMe.fulfilled('a-token', 'req-login', { email: 'me@example.com', password: 'password1' }));
  });

  expect(store.getState().launch).toMatchObject({ attempt: attempt + 1, phase: 'running', stage: 'session' });
  expect(mockedRequest.mock.calls.map(([config]) => config.url)).toEqual(['/users/profile']);
  expect(screen.queryByText('See where the money goes')).toBeNull();
});

it('draws nothing while the theme preference is read, and stops waiting for it at the deadline', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  const getItem = jest.mocked(AsyncStorage.getItem);
  const readStored = getItem.getMockImplementation()!;
  getItem.mockImplementation((key) => (key === THEME_PREFERENCE_KEY ? new Promise(() => {}) : readStored(key)));

  try {
    await renderApp();
    expect(screen.queryByText('See where the money goes')).toBeNull();

    await act(() => jest.advanceTimersByTimeAsync(THEME_RESTORE_TIMEOUT_MS));
    expect(screen.getByText('See where the money goes')).toBeTruthy();
  } finally {
    getItem.mockImplementation(readStored);
  }
});
