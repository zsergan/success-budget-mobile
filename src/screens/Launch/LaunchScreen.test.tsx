import { AccessibilityInfo } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { attemptFailed, attemptStarted, stageReached } from '@redux/state/launch/actions';
import type { LaunchFailure } from '@redux/state/launch/initialState';
import { createAppStore } from '@redux/Store';
import LaunchScreen from './LaunchScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn(() => new Promise(() => {})) }),
}));

jest.useFakeTimers();

const metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 62, right: 0, bottom: 34, left: 0 },
};

const renderLaunch = () => {
  const store = createAppStore();

  store.dispatch(attemptStarted({ attempt: 1, startedAt: Date.now() }));
  // The screen is first drawn once the fonts are in, when the session is being checked.
  store.dispatch(stageReached({ attempt: 1, stage: 'session' }));
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <Provider store={store}>
        <LaunchScreen />
      </Provider>
    </SafeAreaProvider>,
  );

  return store;
};

const fail = (store: ReturnType<typeof createAppStore>, failure: LaunchFailure, retryAt?: number) =>
  act(() => {
    store.dispatch(attemptFailed({ attempt: 1, failure, retryAt }));
  });

it('shows only the lockup at first, the progress after 400 ms and the reason after 8 s', async () => {
  renderLaunch();

  expect(screen.getByText('Success Budget')).toBeTruthy();
  expect(screen.queryByText('Checking your session…')).toBeNull();

  await act(() => jest.advanceTimersByTimeAsync(400));
  expect(screen.getByText('Checking your session…')).toBeTruthy();

  await act(() => jest.advanceTimersByTimeAsync(7600));
  expect(screen.getByText('Still checking your session…')).toBeTruthy();
  expect(screen.getByText('This is taking longer than usual. Check your connection.')).toBeTruthy();
});

it('names the stage the attempt is in, and announces the status once rather than every cycle', async () => {
  const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockClear();
  const store = renderLaunch();

  await act(() => jest.advanceTimersByTimeAsync(400));

  expect(screen.getByRole('progressbar', { name: 'Checking your session…' })).toBeTruthy();

  act(() => {
    store.dispatch(stageReached({ attempt: 1, stage: 'requiredData' }));
  });
  await act(() => jest.advanceTimersByTimeAsync(3000));

  expect(screen.getByText('Loading your budgets…')).toBeTruthy();
  expect(announce.mock.calls).toEqual([['Checking your session…'], ['Loading your budgets…']]);
});

it('replaces the progress with the failure, telling a lost connection from a server problem', async () => {
  const store = renderLaunch();

  await act(() => jest.advanceTimersByTimeAsync(400));
  fail(store, 'offline');

  expect(screen.queryByText('Checking your session…')).toBeNull();
  expect(screen.getByRole('header', { name: 'No internet connection' })).toBeTruthy();
});

it('says a server error is not the connection', () => {
  const store = renderLaunch();

  fail(store, 'server');

  expect(screen.getByText('It’s on our side, not your connection. Try again in a moment.')).toBeTruthy();
});

it('counts down a 429 pause before Try again starts a new attempt', async () => {
  const store = renderLaunch();

  fail(store, 'rateLimited', Date.now() + 3000);

  expect(screen.getByText('Try again in 3 s')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Try again' }).props.accessibilityHint).toBe('Available in 3 seconds');
  fireEvent.press(screen.getByText('Try again in 3 s'));
  expect(store.getState().launch.attempt).toBe(1);

  await act(() => jest.advanceTimersByTimeAsync(3000));

  fireEvent.press(screen.getByText('Try again'));
  expect(store.getState().launch).toMatchObject({ attempt: 2, phase: 'running' });
  expect(screen.queryByText('Too many attempts')).toBeNull();
});
