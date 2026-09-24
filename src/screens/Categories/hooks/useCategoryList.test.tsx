import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import type { CategoryModel } from '@api/models';
import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import useCategoryList from './useCategoryList';

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

const archivedCategory = { id: 5 } as CategoryModel;

const renderCategoryList = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(10));

  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useCategoryList(), { wrapper: Wrapper });

  return { store, result };
};

beforeEach(() => jest.clearAllMocks());

it('alerts a failed restore of the current session', async () => {
  const { result } = renderCategoryList();

  mockedRequest.mockRejectedValue({ response: { data: { message: 'Category not found', statusCode: 404 } } });

  await act(() => result.current.handleRestore(archivedCategory));

  expect(mockedAddAlert).toHaveBeenCalledWith('Category not found');
});

it('stays silent when a logout aborts a restore', async () => {
  const { store, result } = renderCategoryList();

  mockedRequest.mockReturnValue(new Promise(() => {}));

  await act(async () => {
    const restoring = result.current.handleRestore(archivedCategory);

    await store.dispatch(logoutMe());
    await restoring;
  });

  expect(mockedAddAlert).not.toHaveBeenCalled();
});
