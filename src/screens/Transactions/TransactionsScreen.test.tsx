import type { ReactNode, Ref } from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ScrollView, SectionList, StyleSheet, VirtualizedList } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { baseApi, spaceTags } from '@redux/api/baseApi';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionApi } from '@redux/state/transaction/api';
import { feedDto, transactionDto } from '@redux/state/transaction/fixtures';
import { deleteTransaction } from '@redux/state/transactionFlow/thunks';
import { mapTransaction } from '@api/models';
import { ScreenNames, TransactionKind, TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import type { MainTabParamList } from '@shared/types';
import { hexToRgba } from '@shared/utils';
import { Fab } from '@components';
import TransactionsScreen from './TransactionsScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => true,
}));
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

// Where each scroll lands, read through SectionList's own index arithmetic: a row's id, or a day's header.
const spyLandings = () => {
  const landings: { id: string; viewPosition?: number }[] = [];
  const spy = jest.spyOn(VirtualizedList.prototype, 'scrollToIndex').mockImplementation(function (
    this: VirtualizedList<unknown>,
    { index, viewPosition },
  ) {
    const item = this.props.getItem?.(this.props.data, index) as { id?: string } | undefined;
    landings.push({ id: item?.id ?? 'header', viewPosition });
  });

  return { landings, restore: () => spy.mockRestore() };
};

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
      around_id: 'tx-aug',
    });
    expect(screen.getByText('Taxi')).toBeTruthy();
    expect(navigationRef.getCurrentRoute()?.params).toEqual({ filter: undefined, reveal: undefined });
  });

  it('lands on a revealed row once it is measured, and fades it only after it has been on screen', async () => {
    const { landings, restore } = spyLandings();
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

    expect(landings).toEqual([{ id: 'tx-aug', viewPosition: 0.4 }]);
    act(() => list.props.onScrollToIndexFailed({ index: 1, highestMeasuredFrameIndex: 0, averageItemLength: 70 }));
    fireEvent(row, 'layout', { nativeEvent: { layout: { x: 0, y: 900, width: 300, height: 70 } } });
    expect(landings).toEqual([
      { id: 'tx-aug', viewPosition: 0.4 },
      { id: 'tx-aug', viewPosition: 0.4 },
    ]);

    await act(async () => jest.advanceTimersByTimeAsync(5000));
    expect(isLit()).toBe(true);

    act(() => list.props.onViewableItemsChanged({ viewableItems: [{ item: mapTransaction(taxi), isViewable: true }] }));
    await act(async () => jest.advanceTimersByTimeAsync(2500));
    expect(isLit()).toBe(false);
    restore();
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
        ? Promise.reject({ response: { status: 500, data: { statusCode: 500, message: 'boom' } } })
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
        ? Promise.reject({ response: { status: 500, data: { statusCode: 500, message: 'boom' } } })
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
    expect(screen.getByText('Couldn’t load more')).toBeTruthy();
    expect(screen.getAllByText('Sun, Sep 20')).toHaveLength(1);

    failNext = false;
    fireEvent.press(screen.getByText('Retry'));
    await settle();
    expect(listRequests().filter(({ params }) => params?.cursor === 'c1')).toHaveLength(2);
    expect(screen.getAllByText('Sun, Sep 20')).toHaveLength(1);
    expect(screen.getByText('second')).toBeTruthy();
    expect(screen.getByText('Thu, Sep 3')).toBeTruthy();
    expect(screen.queryByText('Couldn’t load more')).toBeNull();
  });

  it('opens the month at the revealed row and reads newer rows above it on the way up', async () => {
    const newer = transactionDto({ id: 'tx-newer', timestamp: new Date(2026, 7, 20).toISOString() });
    mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
      if (url !== FEED) return Promise.resolve({ data: null });

      return Promise.resolve({
        data: params?.cursor
          ? feedDto([newer], { page_info: { next_cursor: 'n1', previous_cursor: null } })
          : feedDto([taxi], { page_info: { next_cursor: null, previous_cursor: 'p1' } }),
      });
    });

    renderTransactions({ reveal: { spaceId: 1, transactionId: 'tx-aug', timestamp: august } });
    await settle();

    expect(listRequests().map(({ params }) => params?.around_id)).toEqual(['tx-aug']);
    expect(screen.getByText('Taxi')).toBeTruthy();

    act(() => screen.UNSAFE_getByType(SectionList).props.onStartReached());
    await settle();

    expect(listRequests().at(-1)?.params).toMatchObject({ cursor: 'p1' });
    expect(listRequests().at(-1)?.params).not.toHaveProperty('around_id');
    expect(screen.getByText('Thu, Aug 20')).toBeTruthy();

    fireEvent.press(screen.getByText('Year'));
    await settle();

    expect(listRequests().at(-1)?.params).not.toHaveProperty('around_id');
  });

  it('keeps ten pages while scrolling on, and reads the dropped newer ones again on the way back', async () => {
    const pageRow = (n: number) =>
      transactionDto({ id: `p${n}`, timestamp: new Date(2026, 8, 25 - n, 9).toISOString(), description: `row ${n}` });
    mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
      if (url !== FEED) return Promise.resolve({ data: null });
      const n = params?.cursor ? Number(String(params.cursor).slice(1)) : 0;

      return Promise.resolve({
        data: feedDto([pageRow(n)], {
          page_info: { next_cursor: `n${n + 1}`, previous_cursor: n > 0 ? `n${n - 1}` : null },
        }),
      });
    });

    renderTransactions(undefined);
    await settle();
    const list = () => screen.UNSAFE_getByType(SectionList);
    const listed = () =>
      list().props.sections.flatMap(({ data }: { data: { id: string }[] }) => data.map(({ id }) => id));
    // Natively the header (child 0) holds the top; the list's first rows (children 1 and 2) only once newer pages remain.
    const anchors = () => [
      list().props.maintainVisibleContentPosition,
      list().findByType(ScrollView).props.maintainVisibleContentPosition,
    ];
    expect(anchors()).toEqual([undefined, { minIndexForVisible: 0 }]);

    for (let page = 1; page <= 10; page += 1) {
      act(() => list().props.onEndReached());
      await settle();
    }

    expect(listed()).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']);
    expect(anchors()).toEqual([{ minIndexForVisible: 1 }, { minIndexForVisible: 2 }]);
    expect(screen.queryByTestId('history-loading-page')).toBeNull();

    act(() => list().props.onStartReached());
    await settle();

    expect(listRequests().at(-1)?.params?.cursor).toBe('n0');
    expect(listed()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']);
    expect(anchors()).toEqual([undefined, { minIndexForVisible: 0 }]);
  });

  describe('a record shown from elsewhere, and the list after a change', () => {
    const september = (id: string, day: number) =>
      transactionDto({ id, timestamp: new Date(2026, 8, day, 9).toISOString(), description: id });
    const rows = [september('s1', 27), september('s2', 26), september('s3', 25)];
    const reveal = (transactionId: string, timestamp: string) =>
      act(() =>
        navigationRef.navigate(ScreenNames.TRANSACTIONS_TAB, { reveal: { spaceId: 1, transactionId, timestamp } }),
      );

    it('scrolls to a record already listed without asking for it again', async () => {
      const { landings, restore } = spyLandings();
      mockedRequest.mockImplementation(({ url }: RequestConfig) =>
        Promise.resolve({ data: url === FEED ? feedDto(rows) : null }),
      );
      renderTransactions(undefined);
      await settle();
      const before = listRequests().length;

      reveal('s2', rows[1].timestamp);
      await settle();

      expect(listRequests()).toHaveLength(before);
      expect(landings).toEqual([{ id: 's2', viewPosition: 0.4 }]);
      restore();
    });

    it('says a record is no longer there and shows its whole period', async () => {
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        if (params?.around_id)
          return Promise.reject({
            response: {
              status: 404,
              data: { statusCode: 404, code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' },
            },
          });
        return Promise.resolve({ data: feedDto(params?.from === new Date(2026, 7, 1).toISOString() ? [taxi] : []) });
      });

      renderTransactions({ reveal: { spaceId: 1, transactionId: 'tx-gone', timestamp: august } });
      await settle();
      await settle();

      expect(screen.getByText('This transaction is no longer here. Showing the whole period instead.')).toBeTruthy();
      expect(screen.getByText('Taxi')).toBeTruthy();

      fireEvent.press(screen.getByText('OK'));
      expect(screen.queryByText('This transaction is no longer here. Showing the whole period instead.')).toBeNull();
    });

    it('keeps the window around the rows on screen after one of them is deleted', async () => {
      let shown = rows;
      mockedRequest.mockImplementation(({ url, params, method }: RequestConfig & { method?: string }) => {
        if (method === 'DELETE') return Promise.resolve({ data: true });
        if (url !== FEED) return Promise.resolve({ data: null });
        if (params?.around_id === 's2')
          return Promise.reject({
            response: {
              status: 404,
              data: { statusCode: 404, code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' },
            },
          });
        // A window below the newest record, as after scrolling down past dropped pages.
        return Promise.resolve({ data: feedDto(shown, { page_info: { next_cursor: null, previous_cursor: 'p0' } }) });
      });
      const store = renderTransactions(undefined);
      await settle();
      const list = screen.UNSAFE_getByType(SectionList);
      act(() =>
        list.props.onViewableItemsChanged({
          viewableItems: [
            { item: mapTransaction(rows[1]), isViewable: true },
            { item: mapTransaction(rows[2]), isViewable: true },
          ],
        }),
      );
      mockedRequest.mockClear();

      shown = [rows[0], rows[2]];
      await act(async () => {
        await store.dispatch(deleteTransaction({ spaceId: 1, transaction: mapTransaction(rows[1]) }));
      });
      await settle();
      await settle();

      expect(listRequests().length).toBeGreaterThan(0);
      expect(listRequests().every(({ params }) => params?.around_id !== undefined)).toBe(true);
      expect(listRequests().at(-1)?.params?.around_id).toBe('s3');
      expect(screen.queryByText('s2')).toBeNull();
      expect(screen.getByText('s3')).toBeTruthy();
    });

    it('leaves the list as it is when a record is opened and closed', async () => {
      mockedRequest.mockImplementation(({ url }: RequestConfig) =>
        Promise.resolve({ data: url === FEED ? feedDto(rows) : rows[1] }),
      );
      renderTransactions(undefined);
      await settle();
      const before = listRequests().length;

      fireEvent.press(screen.getByText('s2'));
      await settle();

      expect(listRequests()).toHaveLength(before);
      expect(screen.getByText('s1')).toBeTruthy();
    });
  });

  describe('search', () => {
    const coffee = transactionDto({
      id: 'tx-coffee',
      timestamp: new Date(2026, 8, 20, 9).toISOString(),
      description: 'Coffee',
    });

    beforeEach(() => {
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        if (!params?.q) return Promise.resolve({ data: feedDto([coffee, taxi]) });
        return Promise.resolve({ data: feedDto(params.q === 'coffee' ? [coffee] : []) });
      });
    });

    const openSearch = async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Search transactions' }));
      await settle();
      return screen.getByPlaceholderText('Description, category, wallet');
    };

    it('searches the period once typing pauses, hides +, and keeps the period controls', async () => {
      renderTransactions(undefined);
      await settle();
      expect(screen.UNSAFE_queryByType(Fab)).toBeTruthy();

      const field = await openSearch();
      expect(screen.UNSAFE_queryByType(Fab)).toBeNull();
      expect(screen.getByText('Month')).toBeTruthy();

      fireEvent.changeText(field, '  coffee ');
      await act(async () => jest.advanceTimersByTimeAsync(299));
      expect(listRequests().some(({ params }) => params?.q)).toBe(false);

      await act(async () => jest.advanceTimersByTimeAsync(1));
      await settle();
      expect(listRequests().at(-1)?.params).toMatchObject({
        q: 'coffee',
        from: new Date(2026, 8, 1).toISOString(),
      });
      expect(screen.queryByText('Taxi')).toBeNull();
      expect(screen.getByText('Coffee')).toBeTruthy();
    });

    it("sends at once on the keyboard's Search key, and says when nothing matches", async () => {
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();

      fireEvent.changeText(field, 'tea');
      fireEvent(field, 'submitEditing');
      await settle();

      expect(listRequests().at(-1)?.params).toMatchObject({ q: 'tea' });
      expect(screen.getByText('No matches for “tea”')).toBeTruthy();

      fireEvent.press(screen.getByText('Clear search'));
      await settle();
      expect(screen.getByText('Taxi')).toBeTruthy();
      expect(screen.UNSAFE_queryByType(Fab)).toBeNull();
    });

    it('starts each search sent at the top at once, never moving the list as search opens or text is typed', async () => {
      const scrollTo = jest.fn();
      const getScrollResponder = jest
        .spyOn(SectionList.prototype, 'getScrollResponder')
        .mockImplementation(() => ({ scrollTo }) as unknown as ReturnType<SectionList['getScrollResponder']>);
      renderTransactions(undefined);
      await settle();

      const field = await openSearch();
      fireEvent.changeText(field, 'coff');
      await act(async () => jest.advanceTimersByTimeAsync(299));
      expect(scrollTo).not.toHaveBeenCalled();

      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();
      expect(scrollTo.mock.calls).toEqual([[{ y: 0, animated: false }]]);

      fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
      await settle();
      expect(scrollTo).toHaveBeenCalledTimes(2);
      getScrollResponder.mockRestore();
    });

    it('leaves search with Cancel: the plain history of the same period and + again', async () => {
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();

      fireEvent.press(screen.getByText('Cancel'));
      await settle();

      expect(listRequests().at(-1)?.params).not.toHaveProperty('q');
      expect(listRequests().at(-1)?.params).toMatchObject({ from: new Date(2026, 8, 1).toISOString() });
      expect(screen.getByText('Taxi')).toBeTruthy();
      expect(screen.UNSAFE_queryByType(Fab)).toBeTruthy();
    });

    it('shows Searching while a search is out, then its full count and server totals, never the old ones', async () => {
      let answer: (value: unknown) => void = () => {};
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        if (!params?.q) return Promise.resolve({ data: feedDto([coffee, taxi]) });
        return new Promise((resolve) => (answer = resolve));
      });
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();

      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();

      expect(screen.getByText('Searching…')).toBeTruthy();
      expect(screen.getAllByTestId('total-placeholder')).toHaveLength(2);
      expect(screen.queryByText('Taxi')).toBeNull();

      await act(async () =>
        answer({ data: feedDto([coffee], { summary: { count: 61, income: '0.00', expense: '1234.50' } }) }),
      );
      await settle();

      expect(screen.getByText('Search results')).toBeTruthy();
      expect(screen.getByText('61 matches')).toBeTruthy();
      expect(screen.getByText('1 234.50')).toBeTruthy();
      expect(screen.getByText('Coffee')).toBeTruthy();
    });

    it('keeps one field and one status row before, through and after a whole search', async () => {
      let answer: (value: unknown) => void = () => {};
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        if (params?.q === 'coffee') return new Promise((resolve) => (answer = resolve));
        return Promise.resolve({ data: feedDto(params?.q ? [] : [coffee, taxi]) });
      });
      renderTransactions(undefined);
      await settle();
      const statusRow = screen.getByTestId('search-status');

      const field = await openSearch();
      const isSameField = () => screen.getByPlaceholderText('Description, category, wallet') === field;
      expect(screen.getByTestId('search-status')).toBe(statusRow);

      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();
      expect(screen.getByText('Searching…')).toBeTruthy();
      expect(isSameField()).toBe(true);

      await act(async () => answer({ data: feedDto([coffee]) }));
      await settle();
      expect(screen.getByText('1 match')).toBeTruthy();
      expect(isSameField()).toBe(true);

      fireEvent.changeText(field, 'tea');
      fireEvent(field, 'submitEditing');
      await settle();
      expect(screen.getByText('No matches for “tea”')).toBeTruthy();
      expect(isSameField()).toBe(true);

      fireEvent.changeText(field, 'a'.repeat(256));
      await settle();
      expect(screen.getByText('Search is limited to 255 characters')).toBeTruthy();
      expect(isSameField()).toBe(true);

      fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
      await settle();
      expect(screen.getByTestId('search-status')).toBe(statusRow);
      expect(isSameField()).toBe(true);

      fireEvent.press(screen.getByText('Cancel'));
      await settle();
      expect(screen.getByTestId('search-status')).toBe(statusRow);
    });

    it('keeps the text and says the totals are unknown when a search fails, and Try again asks again', async () => {
      let fail = true;
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        if (params?.q && fail)
          return Promise.reject({ response: { status: 500, data: { statusCode: 500, message: 'boom' } } });
        return Promise.resolve({ data: feedDto(params?.q ? [coffee] : [coffee, taxi]) });
      });
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();

      expect(screen.getByText('Couldn’t search. Check your connection and try again.')).toBeTruthy();
      expect(screen.getByText('Search results')).toBeTruthy();
      expect(screen.getAllByText('—')).toHaveLength(3);
      expect(screen.getByPlaceholderText('Description, category, wallet').props.value).toBe('coffee');

      fail = false;
      fireEvent.press(screen.getByText('Try again'));
      await settle();

      expect(listRequests().filter(({ params }) => params?.q === 'coffee')).toHaveLength(2);
      expect(screen.getByText('1 match')).toBeTruthy();
    });

    it('sends only what was typed last when typing fast', async () => {
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();

      for (const text of ['c', 'co', 'cof', 'coff', 'coffee']) {
        fireEvent.changeText(field, text);
        await act(async () => jest.advanceTimersByTimeAsync(100));
      }
      await act(async () => jest.advanceTimersByTimeAsync(300));

      expect(
        listRequests()
          .filter(({ params }) => params?.q)
          .map(({ params }) => params?.q),
      ).toEqual(['coffee']);
    });

    it.each([
      ['Cancel', 'Cancel'],
      ['clearing', 'Clear'],
    ])('drops a search still out after %s and shows the plain history', async (_name, control) => {
      let answer: (value: unknown) => void = () => {};
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        if (params?.q) return new Promise((resolve) => (answer = resolve));
        return Promise.resolve({ data: feedDto([coffee, taxi]) });
      });
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();

      fireEvent.press(control === 'Cancel' ? screen.getByText('Cancel') : screen.getByLabelText('Clear search'));
      await settle();
      await act(async () =>
        answer({ data: feedDto([coffee], { summary: { count: 1, income: '0.00', expense: '9.99' } }) }),
      );
      await settle();

      expect(screen.getByText('Taxi')).toBeTruthy();
      expect(screen.queryByText('Search results')).toBeNull();
      expect(screen.queryByText('9.99')).toBeNull();
    });

    describe('over 255 characters', () => {
      const searches = () => listRequests().flatMap(({ params }) => (params?.q ? [String(params.q)] : []));
      const LIMIT_ERROR = 'Search is limited to 255 characters';

      it.each([
        ['letters', 'a'],
        ['emoji', '😀'],
      ])('sends 255 %s, but never 256, whether typed or sent with Search', async (_name, char) => {
        renderTransactions(undefined);
        await settle();
        const field = await openSearch();

        fireEvent.changeText(field, ` ${char.repeat(256)} `);
        await act(async () => jest.advanceTimersByTimeAsync(300));
        fireEvent(field, 'submitEditing');
        await settle();

        expect(searches()).toEqual([]);
        expect(screen.getByText(LIMIT_ERROR)).toBeTruthy();
        expect(screen.queryByText('Search results')).toBeNull();

        fireEvent.changeText(field, ` ${char.repeat(255)} `);
        await act(async () => jest.advanceTimersByTimeAsync(300));
        await settle();

        expect(searches()).toEqual([char.repeat(255)]);
        expect(screen.queryByText(LIMIT_ERROR)).toBeNull();
      });

      it('keeps the last results when a pasted text is too long, and drops the error on Cancel', async () => {
        renderTransactions(undefined);
        await settle();
        const field = await openSearch();
        fireEvent.changeText(field, 'coffee');
        fireEvent(field, 'submitEditing');
        await settle();

        fireEvent.changeText(field, `coffee ${'x'.repeat(1000)}`);
        fireEvent(field, 'submitEditing');
        await act(async () => jest.advanceTimersByTimeAsync(300));

        expect(searches()).toEqual(['coffee']);
        expect(screen.getByText(LIMIT_ERROR)).toBeTruthy();
        expect(screen.getByText('Coffee')).toBeTruthy();
        expect(screen.queryByText('Couldn’t search. Check your connection and try again.')).toBeNull();

        fireEvent.press(screen.getByText('Cancel'));
        await settle();
        expect(screen.queryByText(LIMIT_ERROR)).toBeNull();
      });
    });

    it('treats a search of only spaces as none', async () => {
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();

      fireEvent.changeText(field, '   ');
      fireEvent(field, 'submitEditing');
      await act(async () => jest.advanceTimersByTimeAsync(400));

      expect(listRequests().some(({ params }) => params?.q !== undefined)).toBe(false);
      expect(screen.queryByText('Search results')).toBeNull();
      expect(screen.getByText('Taxi')).toBeTruthy();
    });

    it('keeps the text across a period change and searches the new period', async () => {
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();

      fireEvent.press(screen.getByText('Year'));
      await settle();

      expect(listRequests().at(-1)?.params).toMatchObject({ q: 'coffee', from: new Date(2026, 0, 1).toISOString() });
      expect(screen.getByPlaceholderText('Description, category, wallet').props.value).toBe('coffee');
    });

    it('brings the plain history back to where it was on Cancel, if the period is the same', async () => {
      const scrollToLocation = jest.spyOn(SectionList.prototype, 'scrollToLocation').mockImplementation(() => {});
      renderTransactions(undefined);
      await settle();
      act(() =>
        screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
          viewableItems: [{ item: mapTransaction(taxi), isViewable: true }],
        }),
      );

      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();
      fireEvent.press(screen.getByText('Cancel'));
      await settle();

      expect(listRequests().at(-1)?.params).toMatchObject({ around_id: 'tx-aug' });
      expect(listRequests().at(-1)?.params).not.toHaveProperty('q');
      expect(scrollToLocation).toHaveBeenLastCalledWith(expect.objectContaining({ viewPosition: 0 }));
      expect(screen.queryByText('This transaction is no longer here. Showing the whole period instead.')).toBeNull();
      scrollToLocation.mockRestore();
    });

    it('lands on the very row, never the one above it, on Cancel and when a record is shown', async () => {
      const sameDay = (id: string, hour: number) =>
        transactionDto({ id, timestamp: new Date(2026, 8, 20, hour).toISOString(), description: id });
      const [latte, tea] = [sameDay('tx-latte', 8), sameDay('tx-tea', 7)];
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        return Promise.resolve({ data: feedDto(params?.q ? [coffee] : [coffee, latte, tea]) });
      });
      const { landings, restore } = spyLandings();
      renderTransactions(undefined);
      await settle();
      act(() =>
        screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
          viewableItems: [latte, tea].map((row) => ({ item: mapTransaction(row), isViewable: true })),
        }),
      );

      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();
      fireEvent.press(screen.getByText('Cancel'));
      await settle();

      expect(listRequests().at(-1)?.params).toMatchObject({ around_id: 'tx-latte' });
      expect(landings.at(-1)).toEqual({ id: 'tx-latte', viewPosition: 0 });

      act(() =>
        navigationRef.navigate(ScreenNames.TRANSACTIONS_TAB, {
          reveal: { spaceId: 1, transactionId: 'tx-tea', timestamp: tea.timestamp },
        }),
      );
      await settle();

      expect(landings.at(-1)).toEqual({ id: 'tx-tea', viewPosition: 0.4 });
      restore();
    });

    it('brings the history back once, never again after another record is shown and fades', async () => {
      const scrollToLocation = jest.spyOn(SectionList.prototype, 'scrollToLocation').mockImplementation(() => {});
      renderTransactions(undefined);
      await settle();
      act(() =>
        screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
          viewableItems: [{ item: mapTransaction(taxi), isViewable: true }],
        }),
      );
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();
      fireEvent.press(screen.getByText('Cancel'));
      await settle();
      expect(scrollToLocation).toHaveBeenLastCalledWith(expect.objectContaining({ viewPosition: 0 }));

      act(() =>
        navigationRef.navigate(ScreenNames.TRANSACTIONS_TAB, {
          reveal: { spaceId: 1, transactionId: 'tx-coffee', timestamp: coffee.timestamp },
        }),
      );
      await settle();
      expect(scrollToLocation).toHaveBeenLastCalledWith(expect.objectContaining({ viewPosition: 0.4 }));
      const callsWhileLit = scrollToLocation.mock.calls.length;

      act(() =>
        screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
          viewableItems: [{ item: mapTransaction(coffee), isViewable: true }],
        }),
      );
      await act(async () => jest.advanceTimersByTimeAsync(3000));

      expect(scrollToLocation).toHaveBeenCalledTimes(callsWhileLit);
      scrollToLocation.mockRestore();
    });

    it.each(['period', 'space', 'filter'])('forgets a return still on its way once the %s changes', async (change) => {
      const scrollToLocation = jest.spyOn(SectionList.prototype, 'scrollToLocation').mockImplementation(() => {});
      let releaseAround: () => void = () => {};
      mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
        if (url !== FEED) return Promise.resolve({ data: null });
        const data = feedDto(params?.q === 'coffee' ? [coffee] : [coffee, taxi]);
        if (params?.around_id) return new Promise((resolve) => (releaseAround = () => resolve({ data })));
        return Promise.resolve({ data });
      });
      const store = renderTransactions(undefined);
      await settle();
      act(() =>
        screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
          viewableItems: [{ item: mapTransaction(taxi), isViewable: true }],
        }),
      );
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();
      fireEvent.press(screen.getByText('Cancel'));
      await settle();

      if (change === 'period') fireEvent.press(screen.getByText('Year'));
      if (change === 'space') act(() => void store.dispatch(activateSpace(2)));
      if (change === 'filter')
        act(() =>
          navigationRef.navigate(ScreenNames.TRANSACTIONS_TAB, {
            filter: {
              spaceId: 1,
              from: new Date(2026, 8, 1).toISOString(),
              to: new Date(2026, 8, 28).toISOString(),
              transactionType: TransactionType.EXPENSE,
              kind: TransactionKind.REGULAR,
              name: 'Food',
              categoryId: 2,
            },
          }),
        );
      await settle();
      await act(async () => releaseAround());
      await settle();

      expect(scrollToLocation).not.toHaveBeenCalledWith(expect.objectContaining({ viewPosition: 0 }));
      scrollToLocation.mockRestore();
    });

    it('opens a changed period at its newest record on Cancel', async () => {
      renderTransactions(undefined);
      await settle();
      act(() =>
        screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
          viewableItems: [{ item: mapTransaction(taxi), isViewable: true }],
        }),
      );
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();
      fireEvent.press(screen.getByText('Year'));
      await settle();

      fireEvent.press(screen.getByText('Cancel'));
      await settle();

      expect(listRequests().at(-1)?.params).not.toHaveProperty('around_id');
      expect(listRequests().at(-1)?.params).toMatchObject({ from: new Date(2026, 0, 1).toISOString() });
    });

    it('closes search when another space is selected', async () => {
      const store = renderTransactions(undefined);
      await settle();
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();

      act(() => {
        store.dispatch(activateSpace(2));
      });
      await settle();

      expect(screen.queryByText('Cancel', { includeHiddenElements: false })).toBeNull();
      expect(screen.UNSAFE_queryByType(Fab)).toBeTruthy();
      expect(mockedRequest.mock.calls.at(-1)?.[0].params).not.toHaveProperty('q');
    });

    it('offers no search under a Stats filter', async () => {
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
      });
      await settle();

      expect(screen.queryByRole('button', { name: 'Search transactions' })).toBeNull();
    });

    it.each(['still out', 'not yet sent'])(
      'ends a search %s once a Stats filter opens, with + under it and the plain history after it',
      async (stage) => {
        let answer: (value: unknown) => void = () => {};
        mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
          if (url !== FEED) return Promise.resolve({ data: null });
          if (params?.q) return new Promise((resolve) => (answer = resolve));
          return Promise.resolve({ data: feedDto([coffee, taxi]) });
        });
        renderTransactions(undefined);
        await settle();
        act(() =>
          screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
            viewableItems: [{ item: mapTransaction(taxi), isViewable: true }],
          }),
        );
        const field = await openSearch();
        fireEvent.changeText(field, 'coffee');
        if (stage === 'still out') fireEvent(field, 'submitEditing');
        await settle();
        const sent = listRequests().length;

        act(() =>
          navigationRef.navigate(ScreenNames.TRANSACTIONS_TAB, {
            filter: {
              spaceId: 1,
              from: new Date(2026, 8, 1).toISOString(),
              to: new Date(2026, 8, 28).toISOString(),
              transactionType: TransactionType.EXPENSE,
              kind: TransactionKind.REGULAR,
              name: 'Food',
              categoryId: 2,
            },
          }),
        );
        await settle();
        await act(async () =>
          answer({ data: feedDto([coffee], { summary: { count: 1, income: '0.00', expense: '9.99' } }) }),
        );
        await act(async () => jest.advanceTimersByTimeAsync(300));

        expect(listRequests().slice(sent)).toEqual([
          expect.objectContaining({ params: expect.not.objectContaining({ q: expect.anything() }) }),
        ]);
        expect(listRequests().at(-1)?.params).toMatchObject({ category_id: 2 });
        expect(screen.queryByText('9.99')).toBeNull();
        expect(screen.UNSAFE_queryByType(Fab)).toBeTruthy();

        fireEvent.press(screen.getByLabelText('Clear filter'));
        await settle();

        expect(listRequests().at(-1)?.params).toEqual({
          from: new Date(2026, 8, 1).toISOString(),
          to: new Date(2026, 8, 30, 23, 59, 59, 999).toISOString(),
          time_zone: ZONE,
        });
        expect(screen.queryByText('Cancel', { includeHiddenElements: false })).toBeNull();
        expect(screen.UNSAFE_queryByType(Fab)).toBeTruthy();
        expect((await openSearch()).props.value).toBe('');
      },
    );

    it('leaves search when a record is shown from elsewhere', async () => {
      renderTransactions(undefined);
      await settle();
      const field = await openSearch();
      fireEvent.changeText(field, 'coffee');
      fireEvent(field, 'submitEditing');
      await settle();

      act(() =>
        navigationRef.navigate(ScreenNames.TRANSACTIONS_TAB, {
          reveal: { spaceId: 1, transactionId: 'tx-aug', timestamp: august },
        }),
      );
      await settle();

      expect(listRequests().at(-1)?.params).not.toHaveProperty('q');
      expect(listRequests().at(-1)?.params).toMatchObject({ around_id: 'tx-aug' });
      expect(screen.UNSAFE_queryByType(Fab)).toBeTruthy();
    });
  });

  it('keeps the server totals while older pages load, never adding up the rows', async () => {
    const day = (id: string, date: number) =>
      transactionDto({ id, amount: '1.00', timestamp: new Date(2026, 8, date, 9).toISOString(), description: id });
    const summary = { count: 900, income: '98765432109876543.21', expense: '50000.00' };
    mockedRequest.mockImplementation(({ url, params }: RequestConfig) => {
      if (url !== FEED) return Promise.resolve({ data: null });
      return Promise.resolve({
        data: params?.cursor
          ? feedDto([day('b', 10)], { summary })
          : feedDto([day('a', 20)], { summary, page_info: { next_cursor: 'c1', previous_cursor: null } }),
      });
    });
    renderTransactions(undefined);
    await settle();
    expect(screen.getByText('98 765 432 109 876 543.21')).toBeTruthy();

    act(() => screen.UNSAFE_getByType(SectionList).props.onEndReached());
    await settle();

    expect(screen.getByText('b')).toBeTruthy();
    expect(screen.getByText('98 765 432 109 876 543.21')).toBeTruthy();
    expect(screen.getByText('50 000.00')).toBeTruthy();
  });

  it('keeps the window around the rows on screen after an edit deep in the history', async () => {
    const deep = (n: number) =>
      transactionDto({ id: `d${n}`, timestamp: new Date(2026, 8, 28 - n, 9).toISOString(), description: `d${n}` });
    mockedRequest.mockImplementation(({ url, params, method }: RequestConfig & { method?: string }) => {
      if (method === 'PATCH')
        return Promise.resolve({ data: { transaction: deep(5), wallets: [{ id: 1, balance: 1, is_deleted: false }] } });
      if (url !== FEED) return Promise.resolve({ data: null });
      if (params?.around_id) return Promise.resolve({ data: feedDto([deep(4), deep(5), deep(6)]) });
      const n = params?.cursor ? Number(String(params.cursor).slice(1)) : 0;
      return Promise.resolve({
        data: feedDto([deep(n)], { page_info: { next_cursor: `c${n + 1}`, previous_cursor: n ? `c${n - 1}` : null } }),
      });
    });
    const store = renderTransactions(undefined);
    await settle();
    for (let page = 1; page <= 5; page += 1) {
      act(() => screen.UNSAFE_getByType(SectionList).props.onEndReached());
      await settle();
    }
    act(() =>
      screen.UNSAFE_getByType(SectionList).props.onViewableItemsChanged({
        viewableItems: [{ item: mapTransaction(deep(5)), isViewable: true }],
      }),
    );
    mockedRequest.mockClear();

    await act(async () => {
      await store.dispatch(
        transactionApi.endpoints.updateTransaction.initiate({
          spaceId: 1,
          transactionId: 'd5',
          version: 1,
          idempotencyKey: 'key-1',
          data: { description: 'edited' },
        }),
      );
    });
    await settle();

    expect(listRequests().map(({ params }) => params?.around_id ?? params?.cursor ?? 'first')).toEqual(['d5']);
  });
});
