import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import type { CategoryModel } from '@api/models';
import { createToastRecorder } from '@components/Toast/testing';
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

const mockToasts = createToastRecorder();
jest.mock('@hooks', () => ({ useToast: () => mockToasts.toast }));

const archivedCategory = { id: 5, name: 'Cafe' } as CategoryModel;

const renderCategoryList = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(10));

  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useCategoryList(), { wrapper: Wrapper });

  return { store, result };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockToasts.clear();
});

it('confirms a restore, since the row leaves Archived', async () => {
  const { result } = renderCategoryList();

  mockedRequest.mockResolvedValue({
    data: {
      id: 5,
      name: 'Cafe',
      transaction_type: 'expense',
      icon: 'coffee',
      color: 'evergreen',
      is_active: 1,
      transaction_count: 2,
      limit: null,
      archived_at: null,
    },
  });

  await act(() => result.current.handleRestore(archivedCategory));

  expect(mockToasts.shown).toEqual([{ message: { tone: 'success', text: '“Cafe” restored' }, when: 'now' }]);
});

it('reports a failed restore of the current session', async () => {
  const { result } = renderCategoryList();

  mockedRequest.mockRejectedValue({
    response: { status: 404, data: { message: 'Category not found', statusCode: 404 } },
  });

  await act(() => result.current.handleRestore(archivedCategory));

  expect(mockToasts.shown).toEqual([{ message: { tone: 'error', text: 'Category not found' }, when: 'now' }]);
});

it('reports a failed reorder, and says nothing about one that worked', async () => {
  const { result } = renderCategoryList();

  mockedRequest.mockResolvedValueOnce({ data: undefined });
  await act(() => result.current.handleReorder([archivedCategory]));
  expect(mockToasts.shown).toEqual([]);

  mockedRequest.mockRejectedValueOnce({
    response: { status: 409, data: { message: 'Order changed', statusCode: 409 } },
  });
  await act(() => result.current.handleReorder([archivedCategory]));
  expect(mockToasts.shown).toEqual([{ message: { tone: 'error', text: 'Order changed' }, when: 'now' }]);
});

it('stays silent when a logout aborts a restore', async () => {
  const { store, result } = renderCategoryList();

  mockedRequest.mockReturnValue(new Promise(() => {}));

  await act(async () => {
    const restoring = result.current.handleRestore(archivedCategory);

    await store.dispatch(logoutMe());
    await restoring;
  });

  expect(mockToasts.shown).toEqual([]);
});
