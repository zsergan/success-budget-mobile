import type { ReactNode, Ref } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { baseApi, spaceTags } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionDto } from '@redux/state/transaction/fixtures';
import { deleteTransaction } from '@redux/state/transactionFlow/thunks';
import { mapTransaction } from '@api/models';
import { ScreenNames, TransactionType } from '@shared/enums';
import type { MainTabParamList } from '@shared/types';
import TransactionsScreen from './TransactionsScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { ScrollView, View } = jest.requireActual('react-native');

  const BottomSheetModal = React.forwardRef(function BottomSheetModal(
    { children }: { children: ReactNode },
    ref: Ref<unknown>,
  ) {
    const [isOpen, setOpen] = React.useState(false);
    React.useImperativeHandle(ref, () => ({ present: () => setOpen(true), dismiss: () => setOpen(false) }));

    return isOpen ? children : null;
  });

  return {
    BottomSheetModal,
    BottomSheetBackdrop: () => null,
    BottomSheetView: View,
    BottomSheetScrollView: ScrollView,
    useBottomSheet: () => ({ close: () => {} }),
  };
});

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('@hooks/useAlert', () => () => ({ addAlert: jest.fn() }));

jest.useFakeTimers({ now: new Date(2026, 8, 28, 12) });

interface RequestConfig {
  url: string;
  params?: Record<string, string | number | undefined>;
}

const Tab = createBottomTabNavigator<MainTabParamList>();
const navigationRef = createNavigationContainerRef<MainTabParamList>();

const august = new Date(2026, 7, 12, 9).toISOString();
const taxi = transactionDto({
  id: 'tx-aug',
  timestamp: august,
  category: { ...transactionDto().category, name: 'Taxi' },
});

const renderTransactions = (params: MainTabParamList[ScreenNames.TRANSACTIONS_TAB]) => {
  const store = createAppStore();
  withProfile(store);
  store.dispatch(activateSpace(1));

  render(
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator initialRouteName={ScreenNames.TRANSACTIONS_TAB} screenOptions={{ headerShown: false }}>
          <Tab.Screen name={ScreenNames.HOME_TAB} component={() => null} />
          <Tab.Screen name={ScreenNames.TRANSACTIONS_TAB} component={TransactionsScreen} initialParams={params} />
        </Tab.Navigator>
      </NavigationContainer>
    </Provider>,
  );

  return store;
};

const listRequests = () =>
  mockedRequest.mock.calls
    .map(([config]: [RequestConfig]) => config)
    .filter(({ url }) => url === '/spaces/1/transactions');

const settle = () => act(async () => jest.advanceTimersByTimeAsync(10));

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
    if (url !== '/spaces/1/transactions') return Promise.resolve({ data: null });

    return Promise.resolve({ data: params?.from === new Date(2026, 7, 1).toISOString() ? [taxi] : [] });
  });
});

describe('TransactionsScreen', () => {
  it('shows a revealed record on its month with the filter that hid it removed', async () => {
    renderTransactions({
      filter: {
        spaceId: 1,
        from: new Date(2026, 8, 1).toISOString(),
        to: new Date(2026, 8, 28).toISOString(),
        transactionType: TransactionType.EXPENSE,
        name: 'Food',
        categoryId: 2,
      },
      reveal: { spaceId: 1, transactionId: 'tx-aug', timestamp: august },
    });
    await settle();

    expect(listRequests().at(-1)?.params).toEqual({
      from: new Date(2026, 7, 1).toISOString(),
      to: new Date(2026, 7, 31, 23, 59, 59, 999).toISOString(),
    });
    expect(screen.getByText('Taxi')).toBeTruthy();
    expect(navigationRef.getCurrentRoute()?.params).toEqual({ filter: undefined, reveal: undefined });
  });

  it('ignores a reveal meant for another space', async () => {
    renderTransactions({ reveal: { spaceId: 2, transactionId: 'tx-aug', timestamp: august } });
    await settle();

    expect(listRequests().every(({ params }) => params?.from === new Date(2026, 8, 1).toISOString())).toBe(true);
  });

  it('drops a day once its last row is deleted, then picks the empty state for the whole history', async () => {
    const today = transactionDto({ id: 'tx-today', timestamp: new Date(2026, 8, 28, 9).toISOString() });
    const earlier = transactionDto({ id: 'tx-earlier', timestamp: new Date(2026, 8, 20, 9).toISOString() });
    let rows = [today, earlier];
    mockedRequest.mockImplementation(({ url }: RequestConfig & { method?: string }) => {
      if (url === '/spaces/1/transactions') return Promise.resolve({ data: rows });
      if (url === '/spaces/1/transactions/latest') return Promise.resolve({ data: rows[0] ?? null });
      return Promise.resolve({ data: true });
    });

    const store = renderTransactions(undefined);
    await settle();
    expect(screen.getByText('Sun, Sep 20')).toBeTruthy();

    rows = [today];
    await act(async () => {
      await store.dispatch(deleteTransaction({ spaceId: 1, transaction: mapTransaction(earlier) }));
    });
    await settle();
    expect(screen.queryByText('Sun, Sep 20')).toBeNull();
    expect(screen.getByText('Today')).toBeTruthy();

    rows = [];
    await act(async () => {
      await store.dispatch(deleteTransaction({ spaceId: 1, transaction: mapTransaction(today) }));
    });
    await settle();
    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('says a refresh failed while it keeps the rows it had, and retries it', async () => {
    let failList = false;
    mockedRequest.mockImplementation(({ url }: RequestConfig) => {
      if (url !== '/spaces/1/transactions') return Promise.resolve({ data: null });
      return failList
        ? Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } })
        : Promise.resolve({ data: [taxi] });
    });

    const store = renderTransactions(undefined);
    await settle();
    expect(screen.getByText('Taxi')).toBeTruthy();

    failList = true;
    act(() => {
      store.dispatch(baseApi.util.invalidateTags(spaceTags(1, 'Transactions')));
    });
    await settle();
    expect(screen.getByText('Taxi')).toBeTruthy();
    expect(screen.getByText('Couldn’t update the list. It shows what was loaded before.')).toBeTruthy();

    failList = false;
    fireEvent.press(screen.getByText('Retry'));
    await settle();
    expect(screen.queryByText('Couldn’t update the list. It shows what was loaded before.')).toBeNull();
  });
});
