import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { createAppStore } from '@redux/Store';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { profileApi } from '@redux/state/profile/api';
import { activateSpace } from '@redux/state/space/thunks';
import useMemberActions from './useMemberActions';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const mockedAddAlert = jest.fn();

jest.mock('@hooks', () => ({
  useAlert: () => ({ addAlert: mockedAddAlert }),
}));

const createTestStore = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(10));
  store.dispatch(
    profileApi.util.upsertQueryEntries([
      { endpointName: 'getProfile', arg: undefined, value: { id: 777, email: 'me@example.com', name: 'Me' } },
    ]),
  );

  return store;
};

const wrapperFor = (store: ReturnType<typeof createTestStore>) => {
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return Wrapper;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useMemberActions confirm()', () => {
  it('sends only one DELETE for two confirm() calls fired before the next render', async () => {
    const store = createTestStore();
    let resolveRemove!: () => void;

    mockedRequest.mockReturnValue(new Promise((resolve) => (resolveRemove = () => resolve({ data: undefined }))));

    const { result } = renderHook(() => useMemberActions({ onLeft: jest.fn() }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'remove', userId: 42, label: 'Alex' });
    });

    // Two calls in the same synchronous block, before any state update from
    // the first has been committed -- simulates a fast double tap.
    act(() => {
      void result.current.confirm();
      void result.current.confirm();
    });

    resolveRemove();
    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(mockedRequest).toHaveBeenCalledTimes(1);
  });

  it('does not navigate (onLeft) if the space changed before a successful leave settled', async () => {
    const store = createTestStore();
    const onLeft = jest.fn();
    let resolveRemove!: () => void;

    mockedRequest.mockReturnValue(new Promise((resolve) => (resolveRemove = () => resolve({ data: undefined }))));

    const { result } = renderHook(() => useMemberActions({ onLeft }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'leave' });
    });

    let confirmPromise!: Promise<void>;

    act(() => {
      confirmPromise = result.current.confirm();
    });

    act(() => {
      store.dispatch(activateSpace(20));
    });

    resolveRemove();
    await act(() => confirmPromise);

    expect(onLeft).not.toHaveBeenCalled();
  });

  it('navigates (onLeft) after a successful leave that moved the user off the space', async () => {
    const store = createTestStore();
    const onLeft = jest.fn();

    mockedRequest.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useMemberActions({ onLeft }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'leave' });
    });

    await act(() => result.current.confirm());

    expect(onLeft).toHaveBeenCalledTimes(1);
    expect(store.getState().space.currentSpaceId).not.toBe(10);
  });

  it('alerts a failed removal of the current session', async () => {
    const store = createTestStore();

    mockedRequest.mockRejectedValue({ response: { data: { message: 'Not allowed', statusCode: 403 } } });

    const { result } = renderHook(() => useMemberActions({ onLeft: jest.fn() }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'remove', userId: 42, label: 'Alex' });
    });

    await act(() => result.current.confirm());

    expect(mockedAddAlert).toHaveBeenCalledWith('Not allowed');
  });

  it('stays silent when a logout aborts a removal', async () => {
    const store = createTestStore();

    mockedRequest.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMemberActions({ onLeft: jest.fn() }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'remove', userId: 42, label: 'Alex' });
    });

    await act(async () => {
      const confirming = result.current.confirm();

      await store.dispatch(logoutMe());
      await confirming;
    });

    expect(mockedAddAlert).not.toHaveBeenCalled();
  });

  it.each([
    ['success', (resolve: (value: unknown) => void) => resolve({ data: undefined })],
    [
      'failure',
      (_: unknown, reject: (reason: unknown) => void) =>
        reject({ response: { data: { message: 'Server error', statusCode: 500 } } }),
    ],
  ] as const)('ignores a leave from before a logout and a new login (%s)', async (_, respond) => {
    const store = createTestStore();
    const onLeft = jest.fn();
    let settle!: () => void;

    mockedRequest.mockReturnValue(new Promise((resolve, reject) => (settle = () => respond(resolve, reject))));

    const { result } = renderHook(() => useMemberActions({ onLeft }), { wrapper: wrapperFor(store) });

    act(() => {
      result.current.requestAction({ kind: 'leave' });
    });

    await act(async () => {
      const confirming = result.current.confirm();

      await store.dispatch(logoutMe());
      store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
      store.dispatch(activateSpace(99));
      settle();
      await confirming;
    });

    expect(store.getState().space.currentSpaceId).toBe(99);
    expect(onLeft).not.toHaveBeenCalled();
    expect(mockedAddAlert).not.toHaveBeenCalled();
  });
});
