import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { CategoryModel } from '@api/models';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { AppColor, TransactionType } from '@shared/enums';
import CategoryEditorSheet from './CategoryEditorSheet';

const mockedRequest = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));
jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('expo-secure-store');
jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));

const METRICS = { frame: { x: 0, y: 0, width: 375, height: 667 }, insets: { top: 20, left: 0, right: 0, bottom: 0 } };

const gifts: CategoryModel = {
  id: 9,
  name: 'Gifts',
  transactionType: TransactionType.EXPENSE,
  icon: 'gifts',
  color: '#C2416B',
  isActive: true,
  transactionCount: 4,
  limit: null,
  archivedAt: null,
};

const renderSheet = (category?: CategoryModel) => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));

  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <Provider store={store}>
        <CategoryEditorSheet category={category} />
      </Provider>
    </SafeAreaProvider>,
  );
};

const writes = () => mockedRequest.mock.calls.map(([{ method, url, data }]) => ({ method, url, data }));

beforeEach(() => {
  mockedRequest.mockReset();
  mockedRequest.mockImplementation(() => Promise.resolve({ data: { ...gifts, transaction_type: 'expense' } }));
});

describe('CategoryEditorSheet', () => {
  it('creates a category with a custom colour, its name, type and icon kept through the picker', async () => {
    renderSheet();

    fireEvent.changeText(screen.getByPlaceholderText('My category'), 'Coffee runs');
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));
    fireEvent.changeText(screen.getByLabelText('Hex colour'), '#0f8f8a');

    // Picked, not applied: the header still names the draft's colour.
    expect(screen.getAllByText('Slate').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.getByText('Custom · #0F8F8A')).toBeTruthy();
    expect(screen.getByPlaceholderText('My category').props.value).toBe('Coffee runs');

    await act(async () => fireEvent.press(screen.getByText('Create category')));

    expect(writes()).toEqual([
      {
        method: 'POST',
        url: '/spaces/1/categories',
        data: { name: 'Coffee runs', transaction_type: 'expense', icon: 'Other', color: '#0F8F8A' },
      },
    ]);
  });

  it('reopens a saved custom colour and saves a preset picked instead', async () => {
    renderSheet(gifts);

    expect(screen.getByText('Custom · #C2416B')).toBeTruthy();
    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));
    expect(screen.getByText('Saved: #C2416B')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Custom · #C2416B')).toBeTruthy();

    fireEvent.press(screen.getByRole('radio', { name: 'Clay' }));
    await act(async () => fireEvent.press(screen.getByText('Save changes')));

    expect(writes()).toEqual([
      { method: 'PUT', url: '/spaces/1/categories/9', data: { name: 'Gifts', icon: 'Gifts', color: AppColor.CLAY } },
    ]);
  });

  it('keeps the applied custom colour to send again after a failed save', async () => {
    mockedRequest.mockImplementationOnce(() => Promise.reject(new Error('Network Error')));
    renderSheet(gifts);

    fireEvent.press(screen.getByRole('radio', { name: 'Custom colour' }));
    fireEvent.changeText(screen.getByLabelText('Hex colour'), '#3A7BD5');
    fireEvent.press(screen.getByRole('button', { name: 'Apply' }));
    await act(async () => fireEvent.press(screen.getByText('Save changes')));
    await act(async () => fireEvent.press(screen.getByText('Save changes')));

    expect(writes().map(({ data }) => data)).toEqual([
      { name: 'Gifts', icon: 'Gifts', color: '#3A7BD5' },
      { name: 'Gifts', icon: 'Gifts', color: '#3A7BD5' },
    ]);
  });
});
