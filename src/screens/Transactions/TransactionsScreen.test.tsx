import type { ReactNode, Ref } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SectionList, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { baseApi, spaceTags } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { feedDto, transactionDto } from '@redux/state/transaction/fixtures';
import { deleteTransaction } from '@redux/state/transactionFlow/thunks';
import { mapTransaction } from '@api/models';
import { ScreenNames, TransactionKind, TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import type { MainTabParamList } from '@shared/types';
import { hexToRgba } from '@shared/utils';
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

const FEED = '/spaces/1/transactions/feed';
const ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
  mockedRequest.mock.calls.map(([config]: [RequestConfig]) => config).filter(({ url }) => url === FEED);

const settle = () => act(async () => jest.advanceTimersByTimeAsync(10));

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
    if (url !== FEED) return Promise.resolve({ data: null });

    return Promise.resolve({ data: feedDto(params?.from === new Date(2026, 7, 1).toISOString() ? [taxi] : []) });
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
        kind: TransactionKind.REGULAR,
        name: 'Food',
        categoryId: 2,
      },
      reveal: { spaceId: 1, transactionId: 'tx-aug', timestamp: august },
    });
    await settle();

    expect(listRequests().at(-1)?.params).toEqual({
      from: new Date(2026, 7, 1).toISOString(),
      to: new Date(2026, 7, 31, 23, 59, 59, 999).toISOString(),
      time_zone: ZONE,
    });
    expect(screen.getByText('Taxi')).toBeTruthy();
    expect(navigationRef.getCurrentRoute()?.params).toEqual({ filter: undefined, reveal: undefined });
  });

  it('lands on a revealed row once it is measured, and fades it only after it has been on screen', async () => {
    const scrollToLocation = jest.spyOn(SectionList.prototype, 'scrollToLocation').mockImplementation(() => {});
    renderTransactions({ reveal: { spaceId: 1, transactionId: 'tx-aug', timestamp: august } });
    await settle();

    const list = screen.UNSAFE_getByType(SectionList);
    const ancestors = () => {
      const nodes = [];
      for (let node = screen.getByText('Taxi').parent; node; node = node.parent) nodes.push(node);
      return nodes;
    };
    const isLit = () =>
      ancestors().some(
        (node) => StyleSheet.flatten(node.props.style)?.backgroundColor === hexToRgba(colors.accent, 0.14),
      );
    const row = ancestors().find(({ props }) => Object.keys(props).join() === 'onLayout,children')!;

    expect(scrollToLocation).toHaveBeenCalledTimes(1);
    act(() => list.props.onScrollToIndexFailed({ index: 1, highestMeasuredFrameIndex: 0, averageItemLength: 70 }));
    fireEvent(row, 'layout', { nativeEvent: { layout: { x: 0, y: 900, width: 300, height: 70 } } });
    expect(scrollToLocation).toHaveBeenCalledTimes(2);
    expect(scrollToLocation).toHaveBeenLastCalledWith({ sectionIndex: 0, itemIndex: 0, viewPosition: 0.4 });

    await act(async () => jest.advanceTimersByTimeAsync(5000));
    expect(isLit()).toBe(true);

    act(() => list.props.onViewableItemsChanged({ viewableItems: [{ item: mapTransaction(taxi), isViewable: true }] }));
    await act(async () => jest.advanceTimersByTimeAsync(2500));
    expect(isLit()).toBe(false);
    scrollToLocation.mockRestore();
  });

  it('lists only regular income of a wallet under an Income filter, and the usual history once it is cleared', async () => {
    const salary = (id: string, amount: string) =>
      transactionDto({
        id,
        amount,
        transaction_type: TransactionType.INCOME,
        timestamp: new Date(2026, 8, 10).toISOString(),
      });
    mockedRequest.mockImplementation(({ url, params }: RequestConfig) =>
      Promise.resolve({
        data:
          url === FEED && params?.kind
            ? feedDto([salary('tx-1', '3200.00'), salary('tx-2', '850.00')], {
                summary: { count: 2, income: '4050.00', expense: '0.00' },
              })
            : feedDto([]),
      }),
    );
    const filter = {
      spaceId: 1,
      from: '2026-08-31T21:00:00.000Z',
      to: '2026-09-28T09:15:42.123Z',
      transactionType: TransactionType.INCOME,
      kind: TransactionKind.REGULAR,
      name: 'Everyday',
      walletId: 1,
    };
    renderTransactions({ filter });
    await settle();

    expect(listRequests().at(-1)?.params).toEqual({
      from: filter.from,
      to: filter.to,
      transaction_type: TransactionType.INCOME,
      kind: TransactionKind.REGULAR,
      wallet_id: 1,
      time_zone: ZONE,
    });
    expect(screen.getByText(/^Income · /)).toBeTruthy();
    expect(screen.getByText('4 050.00')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Clear filter'));
    await settle();

    expect(screen.queryByTestId('applied-filter')).toBeNull();
    expect(listRequests().at(-1)?.params).toEqual({
      from: new Date(2026, 8, 1).toISOString(),
      to: new Date(2026, 8, 30, 23, 59, 59, 999).toISOString(),
      time_zone: ZONE,
    });
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
      if (url === FEED) return Promise.resolve({ data: feedDto(rows) });
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
      if (url !== FEED) return Promise.resolve({ data: null });
      return failList
        ? Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } })
        : Promise.resolve({ data: feedDto([taxi]) });
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

  it('shows each day with the server total and loads older rows at the end of the list', async () => {
    const september = (id: string, day: number) =>
      transactionDto({ id, timestamp: new Date(2026, 8, day, 9).toISOString(), description: id });
    let failNext = true;
    mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
      if (url !== FEED) return Promise.resolve({ data: null });
      if (!params?.cursor)
        return Promise.resolve({
          data: feedDto([september('first', 20)], {
            day_totals: [{ date: '2026-09-20', net: '-31.50' }],
            page_info: { next_cursor: 'c1', previous_cursor: null },
          }),
        });
      return failNext
        ? Promise.reject({ response: { data: { statusCode: 500, message: 'boom' } } })
        : Promise.resolve({
            data: feedDto([september('second', 20), september('third', 3)], {
              day_totals: [
                { date: '2026-09-20', net: '-31.50' },
                { date: '2026-09-03', net: '0.00' },
              ],
            }),
          });
    });

    renderTransactions(undefined);
    await settle();
    expect(screen.getByText('Sun, Sep 20')).toBeTruthy();
    expect(screen.getByText(/^-31\.50/)).toBeTruthy();

    act(() => screen.UNSAFE_getByType(SectionList).props.onEndReached());
    await settle();
    expect(screen.getByText('Couldn’t load older transactions.')).toBeTruthy();

    failNext = false;
    fireEvent.press(screen.getByText('Retry'));
    await settle();
    expect(listRequests().filter(({ params }) => params?.cursor === 'c1')).toHaveLength(2);
    expect(screen.getAllByText('Sun, Sep 20')).toHaveLength(1);
    expect(screen.getByText('second')).toBeTruthy();
    expect(screen.getByText('Thu, Sep 3')).toBeTruthy();
    expect(screen.queryByText('Couldn’t load older transactions.')).toBeNull();
  });

  it('reads further pages of the month until a revealed row is listed', async () => {
    const newer = transactionDto({ id: 'tx-newer', timestamp: new Date(2026, 7, 20).toISOString() });
    mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
      if (url !== FEED) return Promise.resolve({ data: null });

      return Promise.resolve({
        data: params?.cursor
          ? feedDto([taxi])
          : feedDto([newer], { page_info: { next_cursor: 'c1', previous_cursor: null } }),
      });
    });

    renderTransactions({ reveal: { spaceId: 1, transactionId: 'tx-aug', timestamp: august } });
    await settle();
    await settle();

    expect(listRequests().map(({ params }) => params?.cursor)).toEqual([undefined, 'c1']);
    expect(screen.getByText('Taxi')).toBeTruthy();
  });
});
