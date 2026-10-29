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

it('keeps a failed invite of the current session at the field, with its address', async () => {
  mockedRequest.mockRejectedValue({
    response: { status: 409, data: { message: 'Already a member', statusCode: 409 } },
  });

  const { result } = renderInviteMember();

  await act(() => result.current.submit('alex@example.com'));

  expect(result.current.inviteError).toEqual({ message: 'Already a member' });
  expect(result.current.failedEmail).toBe('alex@example.com');
});

it('says a malformed address is invalid without sending it', async () => {
  const { result } = renderInviteMember();

  await act(() => result.current.submit('alex@'));

  expect(result.current.inviteError).toEqual({ message: 'Enter a valid email address' });
  expect(mockedRequest).not.toHaveBeenCalled();
});

it('leaves a 429 to the cooldown, and an invite answered after a space switch to nobody', async () => {
  const { store, result } = renderInviteMember();
  let fail: (reason: unknown) => void = () => {};

  mockedRequest.mockRejectedValueOnce({ response: { status: 429, data: { message: 'Slow down', statusCode: 429 } } });
  await act(() => result.current.submit('alex@example.com'));
  expect(result.current.inviteError).toBeNull();

  mockedRequest.mockReturnValueOnce(new Promise((_, reject) => (fail = reject)));
  await act(async () => {
    const submitting = result.current.submit('sam@example.com');
    store.dispatch(activateSpace(11));
    fail({ response: { status: 409, data: { message: 'Already a member', statusCode: 409 } } });
    await submitting;
  });

  expect(result.current.inviteError).toBeNull();
});

it('stays silent when a logout aborts the invite', async () => {
  mockedRequest.mockReturnValue(new Promise(() => {}));

  const { store, result } = renderInviteMember();

  await act(async () => {
    const submitting = result.current.submit('alex@example.com');

    await store.dispatch(logoutMe());
    await submitting;
  });

  expect(result.current.inviteError).toBeNull();
  expect(result.current.failedEmail).toBeNull();
});
