import type { ReactNode, Ref } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { spaceApi } from '@redux/state/space/api';
import { activateSpace } from '@redux/state/space/thunks';
import { transactionApi } from '@redux/state/transaction/api';
import type { Space } from '@api/dto';
import { ScreenNames, SpaceType, TransactionType } from '@shared/enums';
import type { MainTabParamList, MainTabScreenProps } from '@shared/types';
import type { StatsFixture } from './fixtures/statsFixtures';
import { STATS_FIXTURES } from './fixtures/statsFixtures';
import StatsScreen from './StatsScreen';
import { createTransactionResponseDto } from '@redux/state/transaction/fixtures';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => true,
}));
jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const { ScrollView, TextInput, View } = jest.requireActual('react-native');
  const SheetContext = React.createContext({ close: () => {} });

  // Shows a sheet's content only between present() and close(), as the real modal does.
  const BottomSheetModal = React.forwardRef(function BottomSheetModal(
    { children }: { children: ReactNode },
    ref: Ref<unknown>,
  ) {
    const [isOpen, setOpen] = React.useState(false);
    const close = () => setOpen(false);
    React.useImperativeHandle(ref, () => ({ present: () => setOpen(true), dismiss: close, close }));

    return isOpen ? <SheetContext.Provider value={{ close }}>{children}</SheetContext.Provider> : null;
  });

  return {
    BottomSheetModal,
    BottomSheetBackdrop: () => null,
    BottomSheetView: View,
    BottomSheetScrollView: ScrollView,
    BottomSheetTextInput: TextInput,
    useBottomSheet: () => React.useContext(SheetContext),
  };
});

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');
jest.mock('@hooks/useAlert', () => () => ({ addAlert: jest.fn() }));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers({ now: new Date(2026, 8, 28, 12) });

type Block = 'summary' | 'trend' | 'breakdown';

interface RequestConfig {
  url: string;
  method?: string;
  params?: Record<string, string | undefined>;
}

const failure = (statusCode: number) => () =>
  Promise.reject({ response: { data: { statusCode, message: 'boom', timestamp: '2026-09-28T09:41:22.000Z' } } });

let fixture: StatsFixture;
let fixtureFor: (config: RequestConfig) => StatsFixture;
// Set to play a server whose clock is behind the device's: a later as_of is refused, and none means its own now.
let serverNow: string | null;
let fail: Partial<Record<Block, () => Promise<never>>>;
let respondSpaces: () => Promise<unknown>;

const personal: Space = {
  id: 1,
  name: 'Personal',
  type: SpaceType.PERSONAL,
  currency: { id: 1, code: 'USD', name: 'US Dollar' },
  role: 'owner',
  member_count: 1,
  created_at: '2026-01-01T00:00:00.000Z',
};

const blockOf = (url: string) => url.split('/').pop() as Block;
const statsCalls = (block?: Block) =>
  mockedRequest.mock.calls
    .map(([config]: [RequestConfig]) => config)
    .filter(({ url }) => url.includes('/statistics/') && (!block || blockOf(url) === block));
const statsRequests = (block?: Block) => statsCalls(block).map(({ url }) => url);
const lastParams = (block: Block) => statsCalls(block).at(-1)?.params;

const answer = (config: RequestConfig) => {
  const block = blockOf(config.url);
  const stats = fixtureFor(config);
  const data =
    block === 'breakdown' ? stats.breakdown[config.params?.transaction_type as TransactionType] : stats[block];
  if (serverNow === null) return Promise.resolve({ data });

  const asOf = config.params?.as_of;
  if (asOf && asOf > serverNow) {
    return Promise.reject({
      response: { data: { statusCode: 400, message: [{ field: 'as_of', error: 'future' }], timestamp: serverNow } },
    });
  }

  return Promise.resolve({ data: { ...data, period: { ...data.period, as_of: asOf ?? serverNow } } });
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const navigationRef = createNavigationContainerRef<MainTabParamList>();

const HistoryProbe = ({ route }: MainTabScreenProps<ScreenNames.TRANSACTIONS_TAB>) => (
  <Text testID="history-filter">{JSON.stringify(route.params?.filter ?? null)}</Text>
);

const renderStats = ({ spaceId = 1 }: { spaceId?: number | null } = {}) => {
  const store = createAppStore();
  if (spaceId !== null) store.dispatch(activateSpace(spaceId));
  // The app keeps the spaces list subscribed from sign-in on.
  store.dispatch(spaceApi.endpoints.getSpaces.initiate());

  const view = render(
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator initialRouteName={ScreenNames.STATS_TAB} screenOptions={{ headerShown: false }}>
          <Tab.Screen name={ScreenNames.HOME_TAB} component={() => null} />
          <Tab.Screen name={ScreenNames.TRANSACTIONS_TAB} component={HistoryProbe} />
          <Tab.Screen name={ScreenNames.STATS_TAB} component={StatsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </Provider>,
  );

  return { store, ...view };
};

// The rows past the first screenful would wait for real layout and scroll events that a test can't produce.
const renderAllRows = () => {
  const list = FlatList as unknown as { defaultProps?: object };
  list.defaultProps = { ...list.defaultProps, initialNumToRender: 100 };
};

const spacesRequests = () => mockedRequest.mock.calls.filter(([config]: [RequestConfig]) => config.url === '/spaces');

const settle = () => act(async () => jest.advanceTimersByTimeAsync(10));

beforeAll(renderAllRows);

beforeEach(() => {
  jest.clearAllMocks();
  fixture = STATS_FIXTURES.month;
  fixtureFor = () => fixture;
  serverNow = null;
  fail = {};
  respondSpaces = () => Promise.resolve({ data: [] });
  mockedRequest.mockImplementation((config: RequestConfig) => {
    if (config.url.includes('/statistics/')) {
      const block = blockOf(config.url);

      return fail[block]?.() ?? answer(config);
    }

    if (config.method === 'POST') return Promise.resolve({ data: createTransactionResponseDto() });

    return config.url === '/spaces' ? respondSpaces() : Promise.resolve({ data: null });
  });
});

describe('StatsScreen', () => {
  it('switches the breakdown and opens Other without asking the server again', async () => {
    renderStats();
    await settle();
    expect(screen.getByText('Housing')).toBeTruthy();
    mockedRequest.mockClear();

    fireEvent.press(screen.getByText('By wallet'));
    expect(screen.getByText('Everyday')).toBeTruthy();
    fireEvent.press(screen.getByText('By category'));
    fireEvent.press(screen.getByText('Other'));
    expect(screen.getByText('Gifts')).toBeTruthy();
    await settle();

    expect(statsRequests()).toHaveLength(0);
  });

  it('switches the breakdown to income asking only for the breakdown, and not again for the active type', async () => {
    renderStats();
    await settle();
    mockedRequest.mockClear();

    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();

    expect(statsRequests()).toEqual(['/spaces/1/statistics/breakdown']);
    expect(lastParams('breakdown')?.transaction_type).toBe('income');
    expect(screen.getByText('Salary')).toBeTruthy();
    expect(screen.queryByText('Housing')).toBeNull();

    mockedRequest.mockClear();
    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    fireEvent.press(screen.getByRole('tab', { name: 'By category' }));
    await settle();

    expect(statsRequests()).toHaveLength(0);
  });

  it('keeps both switches over an empty or failed breakdown', async () => {
    fixture = STATS_FIXTURES.incomeOnly;
    renderStats();
    await settle();

    expect(screen.getByText('No expenses in this period')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Income' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'By wallet' })).toBeTruthy();

    fail.breakdown = failure(500);
    fireEvent.press(screen.getByRole('tab', { name: 'By wallet' }));
    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();

    expect(screen.getByText('Couldn’t load the breakdown')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Expense' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'By category' })).toBeTruthy();

    delete fail.breakdown;
    mockedRequest.mockClear();
    fireEvent.press(screen.getByText('Retry'));
    await settle();

    expect(statsRequests()).toEqual(['/spaces/1/statistics/breakdown']);
    expect(lastParams('breakdown')?.transaction_type).toBe('income');
    expect(screen.getByRole('adjustable').props.accessibilityLabel).toBe('Income by wallet');
  });

  it('charts income by category and by wallet under its own label', async () => {
    renderStats();
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();

    const donut = screen.getByRole('adjustable');
    expect(donut.props.accessibilityLabel).toBe('Income by category');
    expect(donut.props.accessibilityValue.text).toBe('Income, $4,050.00, 2 categories');
    expect(screen.getByText('Freelance')).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'By wallet' }));
    expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Income, $4,050.00, 2 wallets');
    expect(screen.getByText('Savings')).toBeTruthy();
  });

  it('keeps the grouping across a change of type', async () => {
    renderStats();
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'By wallet' }));
    fireEvent.press(screen.getByRole('tab', { name: 'Expense' }));
    await settle();

    expect(screen.getByRole('tab', { name: 'By wallet' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole('adjustable').props.accessibilityLabel).toBe('Expenses by wallet');
    expect(screen.getByText('Everyday')).toBeTruthy();
  });

  it('draws a single group as the whole share', async () => {
    fixture = STATS_FIXTURES.incomeOnly;
    renderStats();
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();

    let shareRow = screen.getByText('100.0%').parent;
    while (shareRow && shareRow.type !== View) shareRow = shareRow.parent;
    const fill = shareRow?.findAll(
      (node) => node.type === View && !!StyleSheet.flatten(node.props.style)?.backgroundColor,
    );

    expect(screen.getByText('Freelance')).toBeTruthy();
    expect(fill?.map((node) => StyleSheet.flatten(node.props.style).width)).toContain('100%');
  });

  it('opens History for an archived category but not for deleted wallets', async () => {
    fixture = STATS_FIXTURES.deletedWallets;
    renderStats();
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'By wallet' }));

    fireEvent.press(screen.getByText('Deleted wallets'));
    expect(navigationRef.getCurrentRoute()?.name).toBe(ScreenNames.STATS_TAB);

    fixture = STATS_FIXTURES.archived;
    fireEvent.press(screen.getByText('Week'));
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'By category' }));
    expect(screen.getByText('Archived')).toBeTruthy();

    fireEvent.press(screen.getByText('Subscriptions'));
    expect(navigationRef.getCurrentRoute()?.name).toBe(ScreenNames.TRANSACTIONS_TAB);
    expect(JSON.parse(String(screen.getByTestId('history-filter').props.children))).toMatchObject({
      name: 'Subscriptions',
      transactionType: 'expense',
      kind: 'regular',
    });
  });

  it('points to the other type when the selected one is empty', async () => {
    fixture = STATS_FIXTURES.incomeOnly;
    renderStats();
    await settle();

    expect(screen.getByText('No expenses in this period')).toBeTruthy();
    expect(screen.getByText('Switch to Income to see what came in.')).toBeTruthy();
    expect(screen.queryByRole('adjustable')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();
    expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Income, $1,700.00, 1 category');

    fixture = STATS_FIXTURES.expenseOnly;
    fireEvent.press(screen.getByText('Week'));
    await settle();
    expect(screen.getByText('No income in this period')).toBeTruthy();
    expect(screen.getByText('Switch to Expense to see where the money went.')).toBeTruthy();
    expect(screen.queryByRole('adjustable')).toBeNull();
  });

  it('does not point to the other type from a summary left by an earlier cycle', async () => {
    fixture = STATS_FIXTURES.expenseOnly;
    const { store } = renderStats();
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();
    expect(screen.getByText('Switch to Expense to see where the money went.')).toBeTruthy();

    fixture = STATS_FIXTURES.noHistory;
    fail.summary = failure(500);
    await act(async () => {
      await store.dispatch(
        transactionApi.endpoints.deleteTransaction.initiate({
          spaceId: 1,
          transactionId: 'tx-1',
          idempotencyKey: 'key-delete',
          version: 1,
        }),
      );
    });
    await settle();

    expect(screen.getByText('Couldn’t update')).toBeTruthy();
    expect(screen.getByText('No income in this period')).toBeTruthy();
    expect(screen.queryByText('Switch to Expense to see where the money went.')).toBeNull();
    expect(screen.getByText('It appears once income is recorded in this period.')).toBeTruthy();
  });

  it('calls a total of zero-amount transactions zero rather than empty', async () => {
    fixture = STATS_FIXTURES.zero;
    renderStats();
    await settle();

    expect(screen.getByText('Expense total is zero')).toBeTruthy();
    expect(screen.getByText('Expenses in this period add up to zero.')).toBeTruthy();
    expect(screen.queryByRole('adjustable')).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();
    expect(screen.getByText('Income total is zero')).toBeTruthy();
  });

  it('drops a picked segment whose group a refresh took away, and does not bring it back', async () => {
    const { store } = renderStats();
    await settle();
    const donutText = () => screen.getByRole('adjustable').props.accessibilityValue.text as string;
    const changeData = (stats: StatsFixture) =>
      act(async () => {
        fixture = stats;
        await store.dispatch(
          transactionApi.endpoints.createTransaction.initiate({
            spaceId: 1,
            idempotencyKey: `key-${stats.breakdown.expense.total.amount}`,
            data: {
              wallet_id: 1,
              category_id: 1,
              transaction_type: TransactionType.EXPENSE,
              amount: '1.00',
              timestamp: '2026-09-28T09:00:00.000Z',
            },
          }),
        );
      });

    for (let step = 0; step < 6; step += 1) {
      fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    }
    expect(donutText()).toMatch(/^Kids & School Supply/);

    await changeData(STATS_FIXTURES.week);
    await settle();
    expect(donutText()).toMatch(/^Spent/);

    await changeData(STATS_FIXTURES.month);
    await settle();
    expect(screen.getByText('Kids & School Supply')).toBeTruthy();
    expect(donutText()).toMatch(/^Spent/);
  });

  it('retries only the block that failed, in its own place', async () => {
    fail.trend = failure(500);
    renderStats();
    await settle();

    expect(screen.getByText('Couldn’t load the trend')).toBeTruthy();
    expect(screen.getByText('Housing')).toBeTruthy();
    expect(screen.queryByText('Couldn’t update')).toBeNull();

    mockedRequest.mockClear();
    delete fail.trend;
    fireEvent.press(screen.getByLabelText('Retry: Couldn’t load the trend'));
    await settle();

    expect(statsRequests('trend')).toHaveLength(1);
    expect(statsRequests()).toHaveLength(1);
    expect(screen.queryByText('Couldn’t load the trend')).toBeNull();
  });

  it('gives local errors to the totals and the breakdown too', async () => {
    fail.summary = failure(500);
    fail.breakdown = failure(500);
    renderStats();
    await settle();

    expect(screen.getByText('Couldn’t load the totals')).toBeTruthy();
    expect(screen.getByText('Couldn’t load the breakdown')).toBeTruthy();
    expect(screen.queryByText('Couldn’t load your stats')).toBeNull();
  });

  it('shows one load failure when every block failed, and retries them all', async () => {
    fail = { summary: failure(503), trend: failure(503), breakdown: failure(503) };
    renderStats();
    await settle();

    expect(screen.getByText('Couldn’t load your stats')).toBeTruthy();
    expect(screen.getByText(/^Error 503 · /)).toBeTruthy();
    expect(screen.queryByText('Couldn’t load the trend')).toBeNull();

    fail = {};
    fireEvent.press(screen.getByText('Retry'));
    await settle();

    expect(screen.getByText('Housing')).toBeTruthy();
  });

  it('treats a refused space as lost access: no Retry, the spaces list is checked again', async () => {
    fail = { summary: failure(403), trend: failure(403), breakdown: failure(403) };
    renderStats();
    await settle();

    expect(screen.getByText('No access to this space')).toBeTruthy();
    expect(screen.queryByText('Retry')).toBeNull();
    expect(spacesRequests()).toHaveLength(2);
    expect(statsRequests()).toHaveLength(3);

    fireEvent.press(screen.getByText('Go to Home'));
    expect(navigationRef.getCurrentRoute()?.name).toBe(ScreenNames.HOME_TAB);
  });

  it('keeps the figures when a refresh fails and offers a lasting Retry', async () => {
    renderStats();
    await settle();

    fail.breakdown = failure(500);
    act(() => navigationRef.navigate(ScreenNames.HOME_TAB));
    await act(async () => jest.advanceTimersByTimeAsync(31_000));
    act(() => navigationRef.navigate(ScreenNames.STATS_TAB));
    await settle();

    expect(screen.getByText('Couldn’t update')).toBeTruthy();
    expect(screen.getByText('Housing')).toBeTruthy();
    await act(async () => jest.advanceTimersByTimeAsync(10_000));
    expect(screen.getByText('Couldn’t update')).toBeTruthy();

    delete fail.breakdown;
    fireEvent.press(screen.getByLabelText('Retry the update'));
    await settle();

    expect(screen.queryByText('Couldn’t update')).toBeNull();
  });

  it('opens History filtered by a row and keeps its state on the way back', async () => {
    renderStats();
    await settle();
    fireEvent.press(screen.getByText('Other'));
    mockedRequest.mockClear();

    fireEvent.press(screen.getByText('Gifts'));
    expect(navigationRef.getCurrentRoute()?.name).toBe(ScreenNames.TRANSACTIONS_TAB);
    expect(JSON.parse(String(screen.getByTestId('history-filter').props.children))).toEqual({
      spaceId: 1,
      name: 'Gifts',
      from: fixture.breakdown.expense.period.from,
      to: fixture.breakdown.expense.period.actual_to,
      transactionType: 'expense',
      kind: 'regular',
      categoryId: 10,
    });

    act(() => navigationRef.navigate(ScreenNames.STATS_TAB));
    await settle();

    expect(screen.getByText('Gifts')).toBeTruthy();
    expect(statsRequests()).toHaveLength(0);
  });

  it('opens the regular income of a wallet from Income by wallet, and comes back to the same view', async () => {
    renderStats();
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'Income' }));
    await settle();
    fireEvent.press(screen.getByRole('tab', { name: 'By wallet' }));
    mockedRequest.mockClear();

    const { period, by_wallet: byWallet } = fixture.breakdown.income;
    const savings = byWallet.primary_items.find((item) => item.name === 'Savings')!;
    fireEvent.press(screen.getByText('Savings'));
    expect(JSON.parse(String(screen.getByTestId('history-filter').props.children))).toEqual({
      spaceId: 1,
      name: 'Savings',
      from: period.from,
      to: period.actual_to,
      transactionType: 'income',
      kind: 'regular',
      walletId: savings.id,
    });

    act(() => navigationRef.navigate(ScreenNames.STATS_TAB));
    await settle();

    expect(screen.getByRole('tab', { name: 'Income' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole('tab', { name: 'By wallet' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByRole('adjustable').props.accessibilityValue.text).toBe('Income, $4,050.00, 2 wallets');
    expect(statsRequests()).toHaveLength(0);
  });

  describe('without a space', () => {
    it('waits on placeholders while the spaces list is on its way', async () => {
      respondSpaces = () => new Promise(() => {});
      renderStats({ spaceId: null });
      await settle();

      expect(screen.getAllByTestId('block-placeholder').length).toBeGreaterThan(0);
      expect(screen.queryByRole('alert')).toBeNull();
      expect(statsRequests()).toHaveLength(0);
    });

    it('offers to load the spaces again when the list failed, then shows the stats', async () => {
      respondSpaces = failure(503);
      renderStats({ spaceId: null });
      await settle();

      expect(screen.getByText('Couldn’t load your spaces')).toBeTruthy();
      expect(screen.getByText(/^Error 503 · /)).toBeTruthy();
      expect(screen.queryByTestId('block-placeholder')).toBeNull();

      expect(statsRequests()).toHaveLength(0);

      respondSpaces = () => Promise.resolve({ data: [personal] });
      fireEvent.press(screen.getByText('Retry'));
      await settle();

      expect(spacesRequests()).toHaveLength(2);
      expect(statsRequests().sort()).toEqual([
        '/spaces/1/statistics/breakdown',
        '/spaces/1/statistics/summary',
        '/spaces/1/statistics/trend',
      ]);
      expect(screen.queryByText('Couldn’t load your spaces')).toBeNull();
      expect(screen.queryByTestId('block-placeholder')).toBeNull();
      expect(screen.getByText('Housing')).toBeTruthy();
    });

    it('asks to choose a space when the list has some but none is selected', async () => {
      respondSpaces = () => Promise.resolve({ data: [personal] });
      const { store } = renderStats({ spaceId: null });
      await settle();
      act(() => {
        store.dispatch(activateSpace(null));
      });

      expect(screen.getByText('No space selected')).toBeTruthy();
      expect(screen.getByText('Choose a space')).toBeTruthy();
      expect(screen.queryByTestId('block-placeholder')).toBeNull();
    });

    it('leads to creating a space when there is none', async () => {
      renderStats({ spaceId: null });
      await settle();

      expect(screen.getByText('No space yet')).toBeTruthy();
      expect(screen.getByText('Create a space')).toBeTruthy();
      expect(screen.queryByTestId('block-placeholder')).toBeNull();
      expect(statsRequests()).toHaveLength(0);
    });
  });

  describe('regression chains', () => {
    it('on the server clock, a new transaction still brings new figures', async () => {
      serverNow = '2026-09-27T00:00:00.000Z';
      const { store } = renderStats();
      await settle();

      expect(statsCalls('summary').map(({ params }) => params?.as_of)).toEqual([expect.any(String), undefined]);
      expect(lastParams('trend')?.as_of).toBe(serverNow);
      expect(screen.getAllByText('$2,864.40').length).toBeGreaterThan(0);

      serverNow = '2026-09-27T00:05:00.000Z';
      fixture = STATS_FIXTURES.august;
      await act(async () => {
        await store.dispatch(
          transactionApi.endpoints.createTransaction.initiate({
            spaceId: 1,
            idempotencyKey: 'key-1',
            data: {
              wallet_id: 1,
              category_id: 1,
              transaction_type: TransactionType.EXPENSE,
              amount: '242.35',
              timestamp: serverNow!,
            },
          }),
        );
      });
      await settle();

      expect(statsCalls('summary')).toHaveLength(3);
      expect(lastParams('summary')?.as_of).toBeUndefined();
      expect(lastParams('trend')?.as_of).toBe(serverNow);
      expect(lastParams('breakdown')?.as_of).toBe(serverNow);
      expect(screen.getAllByText('$3,106.75').length).toBeGreaterThan(0);
      expect(screen.queryByText('$2,864.40')).toBeNull();
    });

    it('opens a past month from the picker as a Month with its comparison', async () => {
      fixtureFor = (config) => (config.params?.anchor_date === '2026-08-01' ? STATS_FIXTURES.august : fixture);
      renderStats();
      await settle();

      fireEvent.press(screen.getByText('1–30 Sep 2026'));
      fireEvent.press(screen.getByLabelText('Previous month'));
      fireEvent.press(screen.getByText('Apply period'));
      await settle();

      const params = lastParams('summary');
      expect(params).toMatchObject({ period: 'month', anchor_date: '2026-08-01' });
      expect(params).not.toHaveProperty('from_date');
      expect(lastParams('trend')).toEqual(params);
      expect(lastParams('breakdown')).toEqual({ ...params, transaction_type: 'expense' });

      expect(screen.getByText('1–31 Aug 2026')).toBeTruthy();
      expect(screen.queryByText('Reset')).toBeNull();
      expect(screen.getAllByText(/vs Jul/).length).toBeGreaterThan(0);
      expect(screen.queryByText('No comparison')).toBeNull();
    });
  });
});
