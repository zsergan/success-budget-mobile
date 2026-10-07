import type { ReactNode } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { activateSpace, SPACE_REFRESH_AFTER_MS } from '@redux/state/space/thunks';
import { walletApi } from '@redux/state/wallet/api';
import useSpaceRefresh from './useSpaceRefresh';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

let focusListener: (() => void) | undefined;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    addListener: (_event: 'focus', listener: () => void) => {
      focusListener = listener;
      return () => (focusListener = undefined);
    },
    isFocused: () => true,
  }),
}));

let appStateListener: ((state: AppStateStatus) => void) | undefined;

const overview = { total_balance: 0, total_balance_currency: 'USD', delta_percent: 0, wallets: [] };

const walletRequests = () =>
  mockedRequest.mock.calls.filter(([config]: [{ url: string }]) => config.url === '/spaces/1/wallets').length;

const renderRefresh = async () => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));
  store.dispatch(walletApi.endpoints.getWallets.initiate({ spaceId: 1 }));

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const counter = { renders: 0 };
  renderHook(
    () => {
      counter.renders += 1;
      useSpaceRefresh();
    },
    { wrapper },
  );
  await act(async () => jest.advanceTimersByTimeAsync(10));

  return counter;
};

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 8, 30, 12) });
  mockedRequest.mockReset();
  mockedRequest.mockResolvedValue({ data: overview });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    appStateListener = listener as (state: AppStateStatus) => void;
    return { remove: () => (appStateListener = undefined) } as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('useSpaceRefresh', () => {
  it('asks again for the space data on a return, at most every 30 s', async () => {
    await renderRefresh();
    expect(walletRequests()).toBe(1);

    act(() => focusListener?.());
    await act(async () => jest.advanceTimersByTimeAsync(10));
    expect(walletRequests()).toBe(1);

    await act(async () => jest.advanceTimersByTimeAsync(SPACE_REFRESH_AFTER_MS));
    act(() => {
      appStateListener?.('background');
      appStateListener?.('active');
    });
    await act(async () => jest.advanceTimersByTimeAsync(10));
    expect(walletRequests()).toBe(2);
  });

  it('renders again and refreshes once a new month begins', async () => {
    jest.setSystemTime(new Date(2026, 8, 30, 23, 59));
    const counter = await renderRefresh();
    const renders = counter.renders;

    await act(async () => jest.advanceTimersByTimeAsync(2 * 60 * 1000));

    expect(counter.renders).toBeGreaterThan(renders);
    expect(walletRequests()).toBe(2);
  });
});
