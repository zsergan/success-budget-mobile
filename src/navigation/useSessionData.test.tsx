import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { act, renderHook } from '@testing-library/react-native';

import { selectProfileId } from '@redux/state/profile/selectors';
import { retryLaunch, runLaunch } from '@redux/state/launch/thunks';
import { createAppStore } from '@redux/Store';
import useSessionData from './useSessionData';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('expo-font', () => ({ loadAsync: jest.fn(() => Promise.resolve()) }));

jest.useFakeTimers();

let spacesFail = true;

beforeEach(() => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('a-token');
  mockedRequest.mockImplementation(({ url }: { url: string }) => {
    if (url === '/users/profile') return Promise.resolve({ data: { id: 1, email: 'me@example.com', name: 'Me' } });
    if (url === '/spaces' && spacesFail)
      return Promise.reject({ response: { data: { statusCode: 500, message: 'boom', path: '', timestamp: '' } } });

    return Promise.resolve({ data: [] });
  });
});

it('keeps the checked profile through a long wait on a failure, so a retry does not load it as a new user', async () => {
  const store = createAppStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { unmount } = renderHook(() => useSessionData(), { wrapper });

  await act(() => store.dispatch(runLaunch()));
  expect(store.getState().launch.phase).toBe('failed');

  // Well past the cache's 60 s for data nobody subscribes to.
  await act(() => jest.advanceTimersByTimeAsync(120_000));
  expect(selectProfileId(store.getState())).toBe(1);

  spacesFail = false;
  await act(async () => {
    store.dispatch(retryLaunch());
    await jest.advanceTimersByTimeAsync(0);
  });

  expect(store.getState().launch.phase).toBe('ready');
  expect(mockedRequest.mock.calls.filter(([config]) => config.url === '/users/profile')).toHaveLength(1);

  unmount();
});
