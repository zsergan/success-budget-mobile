import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { attemptFailed, attemptStarted } from '@redux/state/launch/actions';
import { createAppStore } from '@redux/Store';
import LoadingScreen from './LoadingScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));

jest.useFakeTimers();

const renderFailed = (failure: Parameters<typeof attemptFailed>[0]['failure'], retryAt?: number) => {
  const store = createAppStore();

  store.dispatch(attemptStarted({ attempt: 1, startedAt: Date.now() }));
  store.dispatch(attemptFailed({ attempt: 1, failure, retryAt }));
  render(
    <Provider store={store}>
      <LoadingScreen />
    </Provider>,
  );

  return store;
};

it('tells a lost connection from a server problem', () => {
  renderFailed('offline');
  expect(screen.getByText('No internet connection')).toBeTruthy();

  renderFailed('server');
  expect(screen.getByText('It’s on our side, not your connection. Try again in a moment.')).toBeTruthy();
});

it('counts down a 429 pause before Try again works', async () => {
  const store = renderFailed('rateLimited', Date.now() + 3000);

  expect(screen.getByText('Try again in 3 s')).toBeTruthy();
  fireEvent.press(screen.getByText('Try again in 3 s'));
  expect(store.getState().launch.attempt).toBe(1);

  await act(() => jest.advanceTimersByTimeAsync(3000));

  fireEvent.press(screen.getByText('Try again'));
  expect(store.getState().launch.attempt).toBe(2);
});
