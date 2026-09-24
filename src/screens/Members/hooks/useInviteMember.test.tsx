import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import useInviteMember from './useInviteMember';

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

const renderInviteMember = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(10));

  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useInviteMember({ canInvite: true, cooldownRemaining: 0 }), {
    wrapper: Wrapper,
  });

  return { store, result };
};

beforeEach(() => jest.clearAllMocks());

it('alerts a failed invite of the current session', async () => {
  mockedRequest.mockRejectedValue({ response: { data: { message: 'Already a member', statusCode: 409 } } });

  const { result } = renderInviteMember();

  await act(() => result.current.submit('alex@example.com'));

  expect(mockedAddAlert).toHaveBeenCalledWith('Already a member');
  expect(result.current.failedEmail).toBe('alex@example.com');
});

it('stays silent when a logout aborts the invite', async () => {
  mockedRequest.mockReturnValue(new Promise(() => {}));

  const { store, result } = renderInviteMember();

  await act(async () => {
    const submitting = result.current.submit('alex@example.com');

    await store.dispatch(logoutMe());
    await submitting;
  });

  expect(mockedAddAlert).not.toHaveBeenCalled();
  expect(result.current.failedEmail).toBeNull();
});
