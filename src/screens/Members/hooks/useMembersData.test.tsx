import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { SpaceMember } from '@api/dto';
import { baseApi, spaceTags } from '@redux/api/baseApi';
import { activateSpace } from '@redux/state/space/thunks';
import { createAppStore } from '@redux/Store';
import useMembersData from './useMembersData';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const member: SpaceMember = {
  type: 'member',
  id: 1,
  user_id: 101,
  name: 'Me',
  email: 'me@example.com',
  role: 'owner',
  can_remove: false,
};

const serverError = { response: { data: { statusCode: 500, message: 'boom' } } };

const renderMembers = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return { store, ...renderHook(() => useMembersData(), { wrapper }) };
};

beforeEach(() => jest.clearAllMocks());

describe('useMembersData load states', () => {
  it('reports a first load until the list arrives', async () => {
    mockedRequest.mockReturnValue(new Promise(() => {}));

    const { result, unmount } = renderMembers();

    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.error).toBeUndefined();

    unmount();
  });

  it('tells an empty list apart from a failed one', async () => {
    mockedRequest.mockResolvedValueOnce({ data: [] });

    const empty = renderMembers();

    await waitFor(() => expect(empty.result.current.isInitialLoading).toBe(false));
    expect(empty.result.current.memberRows).toEqual([]);
    expect(empty.result.current.error).toBeUndefined();
    empty.unmount();

    mockedRequest.mockRejectedValueOnce(serverError);

    const failed = renderMembers();

    await waitFor(() => expect(failed.result.current.error).toBeDefined());
    expect(failed.result.current.isInitialLoading).toBe(false);
    failed.unmount();
  });

  it('keeps the rows through a background refresh, and through a failed one', async () => {
    mockedRequest.mockResolvedValueOnce({ data: [member] });

    const { store, result, unmount } = renderMembers();

    await waitFor(() => expect(result.current.memberRows).toHaveLength(1));

    let failRefresh: (reason: unknown) => void = () => {};

    mockedRequest.mockReturnValueOnce(new Promise((_, reject) => (failRefresh = reject)));
    act(() => {
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Members')));
    });

    await waitFor(() => expect(result.current.isRefreshing).toBe(true));
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.memberRows).toHaveLength(1);

    await act(async () => failRefresh(serverError));

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.memberRows).toHaveLength(1);

    unmount();
  });
});
