import type { ReactNode, Ref } from 'react';
import { Text } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';

import type { Space } from '@api/dto';
import { withSheetHost } from '@components/ConfirmationSheet/testing';
import { withToasts } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { withProfile } from '@redux/state/profile/fixtures';
import { spaceApi } from '@redux/state/space/api';
import { activateSpace } from '@redux/state/space/thunks';
import { feedDto, transactionDto } from '@redux/state/transaction/fixtures';
import { STATS_FIXTURES } from '@screens/Stats/fixtures/statsFixtures';
import { ScreenNames, SpaceType, TransactionType } from '@shared/enums';
import type { MainTabParamList } from '@shared/types';
import HomeScreen from './HomeScreen';

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

jest.useFakeTimers({ now: new Date(2026, 8, 28, 12) });

interface RequestConfig {
  url: string;
  params?: Record<string, string | undefined>;
}

const space = (type: SpaceType, memberCount = 3): Space => ({
  id: 1,
  name: 'Family budget',
  type,
  currency: { id: 1, code: 'USD', name: 'US Dollar' },
  role: 'owner',
  member_count: memberCount,
  created_at: '2026-01-01T00:00:00.000Z',
});

let fixture = STATS_FIXTURES.month;

const respond = ({ url, params }: RequestConfig) => {
  if (url.endsWith('/statistics/summary')) return Promise.resolve({ data: fixture.summary });
  if (url.endsWith('/statistics/breakdown')) {
    return Promise.resolve({ data: fixture.breakdown[params?.transaction_type as TransactionType] });
  }
  if (url.endsWith('/transactions/feed')) {
    return Promise.resolve({ data: feedDto([transactionDto({ date: '2026-09-27' })]) });
  }

  return Promise.resolve({ data: [] });
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const navigationRef = createNavigationContainerRef<MainTabParamList>();
const Stub = () => <Text>Elsewhere</Text>;

const renderHome = (type = SpaceType.GROUP, memberCount = 3) => {
  const store = createAppStore();
  withProfile(store);
  store.dispatch(
    spaceApi.util.upsertQueryEntries([
      { endpointName: 'getSpaces', arg: undefined, value: [space(type, memberCount)] },
    ]),
  );
  store.dispatch(activateSpace(1));

  render(
    <Provider store={store}>
      {withSheetHost(
        withToasts(
          <NavigationContainer ref={navigationRef}>
            <Tab.Navigator screenOptions={{ headerShown: false }}>
              <Tab.Screen name={ScreenNames.HOME_TAB} component={HomeScreen} />
              <Tab.Screen name={ScreenNames.TRANSACTIONS_TAB} component={Stub} />
              <Tab.Screen name={ScreenNames.STATS_TAB} component={Stub} />
            </Tab.Navigator>
          </NavigationContainer>,
        ),
      )}
    </Provider>,
  );

  return store;
};

const settle = () => act(async () => jest.advanceTimersByTimeAsync(50));
const requests = (end: string) =>
  mockedRequest.mock.calls.map(([config]: [RequestConfig]) => config).filter(({ url }) => url.endsWith(end));

beforeEach(() => {
  jest.clearAllMocks();
  fixture = STATS_FIXTURES.month;
  mockedRequest.mockImplementation(respond);
});

describe('HomeScreen', () => {
  it("shows the month's net, top spending, spending by assignment and recent transactions, all of one month", async () => {
    renderHome();
    await settle();

    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(screen.getByText('This month')).toBeTruthy();
    expect(screen.getByText('September net')).toBeTruthy();
    expect(screen.getByText('+$1 185.60')).toBeTruthy();
    expect(screen.getByText('Surplus')).toBeTruthy();
    expect(screen.getByText('Top spending')).toBeTruthy();
    expect(screen.getByText('Housing')).toBeTruthy();
    expect(screen.getByText('Spending by assignment')).toBeTruthy();
    expect(screen.getByText('Whole space')).toBeTruthy();
    expect(screen.getByText('No member assigned')).toBeTruthy();
    expect(screen.getByText('Recent transactions')).toBeTruthy();
    expect(screen.getByText('Latest transactions in September')).toBeTruthy();

    const [summary] = requests('/statistics/summary');
    const [breakdown] = requests('/statistics/breakdown');
    const [feed] = requests('/transactions/feed');
    expect(summary.params).toMatchObject({ period: 'month', anchor_date: '2026-09-01' });
    expect(breakdown.params).toMatchObject({ transaction_type: 'expense', as_of: summary.params?.as_of });
    expect(feed.params).toMatchObject({ from_date: '2026-09-01', limit: 3 });
    expect(requests('/statistics/trend')).toEqual([]);
  });

  describe('when the summary and the breakdown disagree', () => {
    const offTotal = { amount: '1.00', count: 1 };
    // The first `mismatched` breakdowns were read after a change the summary did not see.
    const answerMismatched = (mismatched: number) => {
      let breakdowns = 0;
      mockedRequest.mockImplementation((config: RequestConfig) => {
        if (config.url.endsWith('/statistics/breakdown') && breakdowns++ < mismatched) {
          return Promise.resolve({ data: { ...fixture.breakdown[TransactionType.EXPENSE], total: offTotal } });
        }
        return respond(config);
      });
    };
    const cycles = () =>
      requests('/statistics/summary').map((summary, index) => [
        summary.params?.as_of,
        requests('/statistics/breakdown')[index]?.params?.as_of,
      ]);

    it('reads both again once, on one as_of, and shows the pair that agrees', async () => {
      answerMismatched(1);
      renderHome();
      await settle();

      expect(cycles()).toHaveLength(2);
      cycles().forEach(([summaryAsOf, breakdownAsOf]) => expect(breakdownAsOf).toBe(summaryAsOf));
      expect(requests('/statistics/trend')).toEqual([]);
      expect(screen.getByText('Housing')).toBeTruthy();
      expect(screen.queryByText('The figures changed while they loaded and may not add up.')).toBeNull();
    });

    it('says so when they still disagree, and reads them again on Retry', async () => {
      answerMismatched(3);
      renderHome();
      await settle();

      expect(cycles()).toHaveLength(2);
      expect(screen.getByText('The figures changed while they loaded and may not add up.')).toBeTruthy();

      fireEvent.press(screen.getByText('Retry'));
      await settle();

      expect(cycles()).toHaveLength(4);
      cycles().forEach(([summaryAsOf, breakdownAsOf]) => expect(breakdownAsOf).toBe(summaryAsOf));
      expect(requests('/statistics/trend')).toEqual([]);
      expect(screen.queryByText('The figures changed while they loaded and may not add up.')).toBeNull();
    });
  });

  it('moves to an earlier month and back, never past the current one', async () => {
    renderHome();
    await settle();

    expect(screen.getByLabelText('Next month')).toBeDisabled();
    fireEvent.press(screen.getByLabelText('Previous month'));
    await settle();

    expect(screen.getByText('August 2026')).toBeTruthy();
    expect(requests('/statistics/summary').at(-1)?.params).toMatchObject({ anchor_date: '2026-08-01' });
    expect(requests('/transactions/feed').at(-1)?.params).toMatchObject({ from_date: '2026-08-01' });

    fireEvent.press(screen.getByText('Back to September'));
    await settle();
    expect(screen.getByText('This month')).toBeTruthy();
  });

  it('opens Stats and History on its month, type and assignment', async () => {
    renderHome();
    await settle();

    fireEvent.press(screen.getByText('See breakdown'));
    expect(navigationRef.getCurrentRoute()?.name).toBe(ScreenNames.STATS_TAB);
    expect(navigationRef.getRootState()?.routes.find(({ name }) => name === ScreenNames.STATS_TAB)?.params).toEqual({
      screen: ScreenNames.STATS_OVERVIEW_SCREEN,
      params: {
        focus: { spaceId: 1, month: '2026-09-01', transactionType: 'expense', mode: 'category' },
      },
    });

    act(() => navigationRef.navigate(ScreenNames.HOME_TAB));
    fireEvent.press(screen.getByLabelText(/^Whole space, .* Show its expenses$/));
    expect(navigationRef.getCurrentRoute()).toMatchObject({
      name: ScreenNames.TRANSACTIONS_TAB,
      params: {
        focus: {
          spaceId: 1,
          month: '2026-09-01',
          transactionType: 'expense',
          assignment: 'space',
          assignmentName: 'Whole space',
        },
      },
    });
  });

  it('keeps the space and the month above the scrolling dashboard', async () => {
    renderHome();
    await settle();
    const dashboard = within(screen.getByTestId('home-dashboard'));

    expect(screen.getByText('Family budget')).toBeTruthy();
    expect(dashboard.queryByText('Family budget')).toBeNull();
    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(dashboard.queryByText('September 2026')).toBeNull();
    expect(dashboard.queryByLabelText('Previous month')).toBeNull();
    expect(dashboard.getByText('September net')).toBeTruthy();
    expect(dashboard.getByText('Recent transactions')).toBeTruthy();
  });

  it('opens History on the whole month from the preview, with no type or assignment', async () => {
    renderHome();
    await settle();

    fireEvent.press(screen.getByRole('button', { name: 'All transactions for September' }));

    expect(navigationRef.getCurrentRoute()).toMatchObject({
      name: ScreenNames.TRANSACTIONS_TAB,
      params: { focus: { spaceId: 1, month: '2026-09-01' } },
    });
    const { focus } = navigationRef.getCurrentRoute()?.params as MainTabParamList[ScreenNames.TRANSACTIONS_TAB] & {
      focus: object;
    };
    expect(Object.keys(focus).sort()).toEqual(['month', 'spaceId']);
  });

  it("names an earlier year's month with its year, in the preview and its History button", async () => {
    renderHome();
    await settle();

    for (let month = 0; month < 9; month += 1) fireEvent.press(screen.getByLabelText('Previous month'));
    await settle();

    expect(screen.getByText('December 2025')).toBeTruthy();
    expect(screen.getByText('Latest transactions in December 2025')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'All transactions for December 2025' }));
    expect(navigationRef.getCurrentRoute()?.params).toMatchObject({
      focus: { spaceId: 1, month: '2025-12-01' },
    });
  });

  it('opens the month a record was saved to, in its own space only, and takes the request off the route', async () => {
    renderHome();
    await settle();

    act(() =>
      navigationRef.navigate(ScreenNames.HOME_TAB, {
        showMonth: { spaceId: 2, month: '2026-07-04' },
      }),
    );
    await settle();
    expect(screen.getByText('September 2026')).toBeTruthy();

    act(() =>
      navigationRef.navigate(ScreenNames.HOME_TAB, {
        showMonth: { spaceId: 1, month: '2026-07-04' },
      }),
    );
    await settle();

    expect(screen.getByText('July 2026')).toBeTruthy();
    expect(screen.getByText('Latest transactions in July')).toBeTruthy();
    expect(requests('/transactions/feed').at(-1)?.params).toMatchObject({ from_date: '2026-07-01' });
    expect(navigationRef.getCurrentRoute()?.params).toEqual({ showMonth: undefined });
  });

  it('hides every amount on request, the recent transactions included', async () => {
    renderHome();
    await settle();

    fireEvent.press(screen.getByLabelText('Hide amounts'));

    expect(screen.queryByText('+$1 185.60')).toBeNull();
    expect(screen.getByText('+$••••')).toBeTruthy();
    expect(screen.getByText('-••••')).toBeTruthy();
  });

  it('leaves the assignment breakdown out of a personal space', async () => {
    renderHome(SpaceType.PERSONAL, 1);
    await settle();

    expect(screen.getByText('Top spending')).toBeTruthy();
    expect(screen.queryByText('Spending by assignment')).toBeNull();
  });

  it('offers the first transaction in a space with none, with nothing to set up first', async () => {
    fixture = STATS_FIXTURES.noHistory;
    renderHome();
    await settle();

    expect(screen.getByText('Start your first month')).toBeTruthy();
    fireEvent.press(screen.getByText('Add transaction'));
    expect(screen.queryByText('September net')).toBeNull();
  });

  it('says an earlier month had nothing, with zero totals and the way back', async () => {
    renderHome();
    await settle();
    fixture = STATS_FIXTURES.emptyPeriod;
    fireEvent.press(screen.getByLabelText('Previous month'));
    await settle();

    expect(screen.getByText('Nothing in August')).toBeTruthy();
    expect(screen.getByText('Balanced')).toBeTruthy();
    expect(screen.queryByText('Top spending')).toBeNull();
    expect(screen.getAllByText('Back to September').length).toBeGreaterThan(0);
  });
});
