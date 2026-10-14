import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Space } from '@api/dto';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { createAppStore } from '@redux/Store';
import { SpaceType } from '@shared/enums';
import useLaunch from './useLaunch';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const mockedGetItemAsync = jest.mocked(SecureStore.getItemAsync);

const space = (id: number): Space => ({
  id,
  name: `Space ${id}`,
  type: SpaceType.GROUP,
  currency: { id: 1, code: 'USD', name: 'US Dollar' },
  role: 'owner',
  member_count: 1,
  created_at: '2026-01-01T00:00:00.000Z',
});

const serverError = { response: { data: { statusCode: 500, message: 'boom' } } };

type Responder = (url: string) => Promise<{ data: unknown }>;

const respond: Responder = (url) => {
  if (url === '/spaces') return Promise.resolve({ data: [space(1), space(2)] });
  if (url === '/users/profile') return Promise.resolve({ data: { id: 1, email: 'me@example.com', name: 'Me' } });
  if (url.endsWith('/wallets'))
    return Promise.resolve({
      data: { wallets: [], total_balance: 0, total_balance_currency: 'USD', delta_percent: 0 },
    });

  return Promise.resolve({ data: [] });
};

const answerWith = (override: (url: string) => Promise<{ data: unknown }> | undefined) =>
  mockedRequest.mockImplementation(({ url }: { url: string }) => override(url) ?? respond(url));

beforeEach(() => {
  jest.clearAllMocks();
  mockedGetItemAsync.mockResolvedValue('a-token');
  answerWith(() => undefined);
});

const renderLaunch = (store = createAppStore(), resourcesReady = true) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const rendered = renderHook((props: { resourcesReady: boolean }) => useLaunch(props), {
    wrapper,
    initialProps: { resourcesReady },
  });

  return { store, ...rendered };
};

const requested = (url: string) => mockedRequest.mock.calls.filter(([config]) => config.url === url).length;

describe('useLaunch', () => {
  it('holds on the local resources, then reads the stored session, checks it and loads the required data', async () => {
    const { result, rerender, unmount } = renderLaunch(createAppStore(), false);

    expect(result.current.state).toEqual({ status: 'loading', stage: 'resources' });

    rerender({ resourcesReady: true });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready' }));

    expect(requested('/users/profile')).toBe(1);
    expect(requested('/spaces')).toBe(1);
    expect(requested('/spaces/1/wallets')).toBe(1);

    unmount();
  });

  it('opens Welcome when no session is stored, without asking the server', async () => {
    mockedGetItemAsync.mockResolvedValue(null);

    const { result, unmount } = renderLaunch();

    await waitFor(() => expect(result.current.state).toEqual({ status: 'welcome' }));
    expect(mockedRequest).not.toHaveBeenCalled();

    unmount();
  });

  it('offers a retry when the stored session cannot be read, and goes on once it can', async () => {
    mockedGetItemAsync.mockRejectedValueOnce(new Error('Keystore is corrupted'));

    const { result, unmount } = renderLaunch();

    await waitFor(() => expect(result.current.state).toEqual({ status: 'failed', stage: 'storedSession' }));

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready' }));

    unmount();
  });

  it('signs out to Welcome when the server refuses the stored session', async () => {
    answerWith((url) =>
      url === '/users/profile'
        ? Promise.reject({ response: { data: { statusCode: 401, message: 'Unauthorized' } } })
        : undefined,
    );

    const { result, store, unmount } = renderLaunch();

    await waitFor(() => expect(store.getState().api.queries['getProfile(undefined)']?.status).toBe('rejected'));
    // The real client ends the session on a 401; the mocked one leaves that to the test.
    await waitFor(() => expect(result.current.state).toEqual({ status: 'loading', stage: 'session' }));
    await act(async () => {
      await store.dispatch(logoutMe());
    });

    expect(result.current.state).toEqual({ status: 'welcome' });

    unmount();
  });

  it('fails the session check on a server error and repeats only what failed', async () => {
    answerWith((url) => (url === '/users/profile' ? Promise.reject(serverError) : undefined));

    const { result, unmount } = renderLaunch();

    await waitFor(() => expect(result.current.state).toEqual({ status: 'failed', stage: 'session' }));

    answerWith(() => undefined);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready' }));

    expect(requested('/users/profile')).toBe(2);
    expect(requested('/spaces')).toBe(1);

    unmount();
  });

  it('does not open the app on a failed spaces list or wallets', async () => {
    answerWith((url) => (url === '/spaces' ? Promise.reject(serverError) : undefined));

    const first = renderLaunch();

    await waitFor(() => expect(first.result.current.state).toEqual({ status: 'failed', stage: 'requiredData' }));
    first.unmount();

    answerWith((url) => (url.endsWith('/wallets') ? Promise.reject(serverError) : undefined));

    const second = renderLaunch();

    await waitFor(() => expect(second.result.current.state).toEqual({ status: 'failed', stage: 'requiredData' }));

    answerWith(() => undefined);
    act(() => second.result.current.retry());
    await waitFor(() => expect(second.result.current.state).toEqual({ status: 'ready' }));

    second.unmount();
  });

  it('opens the app with an empty spaces list', async () => {
    answerWith((url) => (url === '/spaces' ? Promise.resolve({ data: [] }) : undefined));

    const { result, unmount } = renderLaunch();

    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready' }));

    unmount();
  });

  it('stays in the app across a space switch, and loads again for the next session', async () => {
    const { result, store, unmount } = renderLaunch();

    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready' }));

    answerWith((url) => (url.startsWith('/spaces/') ? new Promise(() => {}) : undefined));
    act(() => {
      store.dispatch(activateSpace(2));
    });

    expect(result.current.state).toEqual({ status: 'ready' });

    await act(async () => {
      await store.dispatch(logoutMe());
    });

    expect(result.current.state).toEqual({ status: 'welcome' });

    act(() => {
      store.dispatch(loginMe.fulfilled('token', 'req-login', { email: 'me@example.com', password: 'password1' }));
    });

    await waitFor(() => expect(store.getState().space.currentSpaceId).not.toBeNull());
    expect(result.current.state).toEqual({ status: 'loading', stage: 'requiredData' });

    unmount();
  });
});
