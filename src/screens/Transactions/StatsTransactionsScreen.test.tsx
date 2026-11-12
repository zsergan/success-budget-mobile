import type { ReactNode, Ref } from 'react';
import { SectionList } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import { Fab } from '@components';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { activateSpace } from '@redux/state/space/thunks';
import { feedDto, transactionDto } from '@redux/state/transaction/fixtures';
import { AppColor, ScreenNames, TransactionKind, TransactionType } from '@shared/enums';
import type { HistoryFilter, StatsStackParamList } from '@shared/types';
import StatsTransactionsScreen from './StatsTransactionsScreen';

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

jest.useFakeTimers({ now: new Date(2026, 8, 30, 12) });

interface RequestConfig {
  url: string;
  params?: Record<string, string | number | undefined>;
}

const METRICS = { frame: { x: 0, y: 0, width: 393, height: 852 }, insets: { top: 59, left: 0, right: 0, bottom: 34 } };
const FEED = '/spaces/1/transactions/feed';

const september = {
  spaceId: 1,
  from: new Date(2026, 8, 1).toISOString(),
  to: new Date(2026, 8, 30, 9, 15, 42, 123).toISOString(),
  timeZone: 'Pacific/Auckland',
  transactionType: TransactionType.INCOME,
  kind: TransactionKind.REGULAR,
  color: AppColor.INDIGO,
};
const freelance: HistoryFilter = { ...september, name: 'Freelance', icon: 'freelance', categoryId: 7 };

const invoice = (id: string, amount: string, day: number) =>
  transactionDto({
    id,
    amount,
    transaction_type: TransactionType.INCOME,
    timestamp: new Date(2026, 8, day, 11).toISOString(),
    category: { ...transactionDto().category, id: 7, name: 'Freelance', transaction_type: TransactionType.INCOME },
  });

const Stack = createNativeStackNavigator<StatsStackParamList>();
const navigationRef = createNavigationContainerRef<StatsStackParamList>();

const renderScreen = (filter: HistoryFilter = freelance) => {
  const store = createAppStore();
  withProfile(store);
  store.dispatch(activateSpace(1));

  render(
    <Provider store={store}>
      <SafeAreaProvider initialMetrics={METRICS}>
        <NavigationContainer
          ref={navigationRef}
          initialState={{
            routes: [
              { name: ScreenNames.STATS_OVERVIEW_SCREEN },
              { name: ScreenNames.STATS_TRANSACTIONS_SCREEN, params: { filter } },
            ],
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={ScreenNames.STATS_OVERVIEW_SCREEN} component={() => null} />
            <Stack.Screen name={ScreenNames.STATS_TRANSACTIONS_SCREEN} component={StatsTransactionsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>,
  );

  return store;
};

const feedRequests = () =>
  mockedRequest.mock.calls.map(([config]: [RequestConfig]) => config).filter(({ url }) => url === FEED);

const settle = () => act(async () => jest.advanceTimersByTimeAsync(10));

const expectNoFilterOrCreateActions = () => {
  expect(screen.queryByLabelText('Search transactions')).toBeNull();
  expect(screen.queryByLabelText('Clear filter')).toBeNull();
  expect(screen.queryByText('Clear filter')).toBeNull();
  expect(screen.queryByText('Reset')).toBeNull();
  expect(screen.queryByText(/^Reset to/)).toBeNull();
  expect(screen.queryByText(/^Jump to/)).toBeNull();
  expect(screen.queryByText('Add transaction')).toBeNull();
  ['Week', 'Month', 'Year'].forEach((preset) => expect(screen.queryByText(preset)).toBeNull());
  expect(screen.UNSAFE_queryByType(Fab)).toBeNull();
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockImplementation(({ url }: RequestConfig) => {
    if (url === '/spaces/1/transactions/tx-1') return Promise.resolve({ data: invoice('tx-1', '450.00', 22) });

    return Promise.resolve({
      data:
        url === FEED
          ? feedDto([invoice('tx-2', '400.00', 25), invoice('tx-1', '450.00', 22)], {
              summary: { count: 2, income: '850.00', expense: '0.00' },
            })
          : null,
    });
  });
});

describe('StatsTransactionsScreen', () => {
  it('lists the selected transactions under their fixed context, with no filter or create actions', async () => {
    renderScreen();
    await settle();

    expect(feedRequests().map(({ params }) => params)).toEqual([
      {
        from: freelance.from,
        to: freelance.to,
        transaction_type: TransactionType.INCOME,
        kind: TransactionKind.REGULAR,
        category_id: 7,
        time_zone: 'Pacific/Auckland',
      },
    ]);
    expect(screen.getByText('Income')).toBeTruthy();
    expect(screen.getAllByText('Freelance')).toHaveLength(3);
    expect(screen.getByText('1–30 Sep 2026')).toBeTruthy();
    expect(screen.getByText('850.00')).toBeTruthy();
    expectNoFilterOrCreateActions();
  });

  it('names an expense wallet selection', async () => {
    renderScreen({
      ...september,
      transactionType: TransactionType.EXPENSE,
      name: 'Everyday',
      icon: 'wallet',
      walletId: 3,
    });
    await settle();

    expect(feedRequests().at(-1)?.params).toMatchObject({ transaction_type: TransactionType.EXPENSE, wallet_id: 3 });
    expect(feedRequests().at(-1)?.params).not.toHaveProperty('category_id');
    expect(screen.getByText('Expenses')).toBeTruthy();
    expect(screen.getByText('Everyday')).toBeTruthy();
  });

  it('explains an empty selection and offers nothing to change it', async () => {
    mockedRequest.mockImplementation(() => Promise.resolve({ data: feedDto([]) }));
    renderScreen();
    await settle();

    expect(screen.getByText('No transactions here')).toBeTruthy();
    expect(screen.getByText('They may have been changed or deleted since Stats was opened.')).toBeTruthy();
    expect(screen.getByText('Income')).toBeTruthy();
    expect(screen.getByText('Freelance')).toBeTruthy();
    expect(screen.getByText('1–30 Sep 2026')).toBeTruthy();
    expect(feedRequests()).toHaveLength(1);
    expectNoFilterOrCreateActions();
  });

  it('retries a failed load with the same selection', async () => {
    mockedRequest.mockImplementationOnce(() =>
      Promise.reject({ response: { status: 500, data: { statusCode: 500, message: 'boom' } } }),
    );
    renderScreen();
    await settle();

    fireEvent.press(screen.getByText('Retry'));
    await settle();

    const [first, second] = feedRequests().map(({ params }) => params);
    expect(second).toEqual(first);
    expect(screen.getAllByText('Freelance')).toHaveLength(3);
  });

  it('opens the details of a listed transaction', async () => {
    const store = renderScreen();
    await settle();

    fireEvent.press(screen.getByText('+450.00'));
    await settle();

    expect(store.getState().transactionFlow.flow).toMatchObject({ spaceId: 1 });
  });

  it('goes back to Stats from a button that stays outside the scrolled list', async () => {
    renderScreen();
    await settle();

    const back = screen.getByRole('button', { name: 'Back to Stats' });
    expect(within(screen.UNSAFE_getByType(SectionList)).queryByLabelText('Back to Stats')).toBeNull();

    fireEvent.press(back);
    await settle();

    expect(navigationRef.getCurrentRoute()?.name).toBe(ScreenNames.STATS_OVERVIEW_SCREEN);
  });

  it('shows and asks for nothing when it opens under another space, and leaves the stack', async () => {
    renderScreen({ ...freelance, spaceId: 2 });
    await settle();

    expect(feedRequests()).toEqual([]);
    expect(screen.queryByTestId('applied-filter')).toBeNull();
    expect(navigationRef.getRootState()?.routes.map(({ name }) => name)).toEqual([ScreenNames.STATS_OVERVIEW_SCREEN]);
  });
});
