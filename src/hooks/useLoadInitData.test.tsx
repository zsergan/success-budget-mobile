import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { Space } from '@api/dto';
import { getProfile } from '@api/profile.api';
import { getSpaces } from '@api/space.api';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { createAppStore } from '@redux/Store';
import { SpaceType } from '@shared/enums';
import useLoadInitData from './useLoadInitData';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('@api/space.api');
jest.mock('@api/profile.api');
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const space = (id: number): Space => ({
  id,
  name: `Space ${id}`,
  type: SpaceType.GROUP,
  currency: { id: 1, code: 'USD', name: 'US Dollar' },
  role: 'owner',
  member_count: 1,
  created_at: '2026-01-01T00:00:00.000Z',
});

const respond = (url: string) => {
  if (url.endsWith('/wallets'))
    return { data: { wallets: [], total_balance: 0, total_balance_currency: 'USD', delta_percent: 0 } };
  if (url.endsWith('/categories')) return { data: { incomes: [], expenses: [], archived: [] } };
  if (url.endsWith('/limits')) return { data: { total: null, categories: [], over_allocation: null } };

  return { data: [] };
};

let holdRequests: boolean;

const signIn = (store: ReturnType<typeof createAppStore>) =>
  store.dispatch(loginMe.fulfilled('token', 'req-login', { email: 'me@example.com', password: 'password1' }));

beforeEach(() => {
  jest.clearAllMocks();
  holdRequests = false;
  jest.mocked(getSpaces).mockResolvedValue([space(1), space(2)]);
  jest.mocked(getProfile).mockResolvedValue({ id: 1, email: 'me@example.com', name: 'Me' });
  mockedRequest.mockImplementation(({ url }: { url: string }) =>
    holdRequests ? new Promise(() => {}) : Promise.resolve(respond(url)),
  );
});

const renderGate = (store: ReturnType<typeof createAppStore>) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return renderHook(({ isSignedIn }: { isSignedIn: boolean }) => useLoadInitData({ isSignedIn }), {
    wrapper,
    initialProps: { isSignedIn: true },
  });
};

describe('useLoadInitData initial-load gate', () => {
  it('holds until the first space settles, then stays open across a space switch', async () => {
    const store = createAppStore();

    signIn(store);
    const { result, unmount } = renderGate(store);

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    holdRequests = true;
    act(() => {
      store.dispatch(activateSpace(2));
    });

    expect(result.current.isLoading).toBe(false);

    unmount();
  });

  it('opens on a failed first load instead of holding forever', async () => {
    mockedRequest.mockRejectedValue({ response: { data: { statusCode: 500, message: 'boom' } } });

    const store = createAppStore();

    signIn(store);
    const { result, unmount } = renderGate(store);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    unmount();
  });

  it('holds again for the first load of the next session', async () => {
    const store = createAppStore();

    signIn(store);
    const { result, rerender, unmount } = renderGate(store);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await store.dispatch(logoutMe());
    });
    rerender({ isSignedIn: false });

    holdRequests = true;
    act(() => {
      signIn(store);
    });
    rerender({ isSignedIn: true });

    await waitFor(() => expect(store.getState().space.currentSpaceId).not.toBeNull());
    expect(result.current.isLoading).toBe(true);

    unmount();
  });
});
