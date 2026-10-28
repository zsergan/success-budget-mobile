import { Text } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer, createNavigationContainerRef, type InitialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { AppColor, ScreenNames } from '@shared/enums';
import type { MainTabParamList, MainTabScreenProps, RootStackParamList } from '@shared/types';
import CreateWalletScreen from './CreateWalletScreen';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));
const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const StatsProbe = ({ route }: MainTabScreenProps<ScreenNames.STATS_TAB>) => (
  <Text testID="stats-params">{JSON.stringify(route.params ?? null)}</Text>
);

const Tabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name={ScreenNames.HOME_TAB} component={() => null} />
    <Tab.Screen name={ScreenNames.STATS_TAB} component={StatsProbe} />
  </Tab.Navigator>
);

const renderFromStats = (addTransaction?: { spaceId: number }) => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));

  const initialState: InitialState = {
    routes: [
      { name: ScreenNames.HOME_SCREEN, state: { routes: [{ name: ScreenNames.STATS_TAB }] } },
      {
        name: ScreenNames.ADD_WALLET_SCREEN,
        params: {
          id: 'new',
          ...(addTransaction && { addTransaction: { returnTo: ScreenNames.STATS_TAB, ...addTransaction } }),
        },
      },
    ],
  };

  render(
    <Provider store={store}>
      <NavigationContainer ref={navigationRef} initialState={initialState}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={ScreenNames.HOME_SCREEN} component={Tabs} />
          <Stack.Screen name={ScreenNames.ADD_WALLET_SCREEN} component={CreateWalletScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>,
  );
};

const createWallet = async () => {
  fireEvent.changeText(screen.getByPlaceholderText('My Wallet'), 'Cash');
  fireEvent.changeText(screen.getByPlaceholderText('0'), '0');
  await act(async () => fireEvent.press(screen.getByText('Create')));
};

const statsParams = () => JSON.parse(String(screen.getByTestId('stats-params').props.children));

const routeNames = () => (navigationRef.getRootState()?.routes ?? []).map((route) => route.name);

beforeEach(() => {
  jest.clearAllMocks();
  mockedRequest.mockImplementation((config: { method?: string }) =>
    config.method === 'POST'
      ? Promise.resolve({
          data: { wallet: { id: 9, wallet_name: 'Cash', design: AppColor.SLATE, balance: 0 }, transaction: null },
        })
      : new Promise(() => {}),
  );
});

describe('creating a wallet for Add transaction', () => {
  it('returns to Stats with the new wallet to compose with', async () => {
    renderFromStats({ spaceId: 1 });

    await createWallet();

    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN]);
    expect(statsParams()).toEqual({ composeWith: { spaceId: 1, walletId: 9 } });
  });

  it('just goes back when the space changed since the sheet was opened', async () => {
    renderFromStats({ spaceId: 2 });

    await createWallet();

    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN]);
    expect(statsParams()).toBeNull();
  });

  it('just goes back without an intent', async () => {
    renderFromStats();

    await createWallet();

    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN]);
    expect(statsParams()).toBeNull();
  });
});

describe('a failed create', () => {
  it('names a missing field beside it and sends nothing', async () => {
    renderFromStats();

    await act(async () => fireEvent.press(screen.getByText('Create')));

    expect(screen.getByText('Enter a wallet name')).toBeTruthy();
    expect(screen.getByText('Enter an amount')).toBeTruthy();
    expect(mockedRequest.mock.calls.filter(([{ method }]) => method === 'POST')).toEqual([]);
  });

  it('says why in the form, keeping what was typed, and lets the user try again', async () => {
    renderFromStats();
    mockedRequest.mockImplementationOnce(() =>
      Promise.reject({ response: { status: 409, data: { message: 'Wallet name already used', statusCode: 409 } } }),
    );

    await createWallet();

    expect(screen.getByText('Wallet name already used')).toBeTruthy();
    expect(screen.getByPlaceholderText('My Wallet').props.value).toBe('Cash');
    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN, ScreenNames.ADD_WALLET_SCREEN]);

    await act(async () => fireEvent.press(screen.getByText('Create')));

    expect(screen.queryByText('Wallet name already used')).toBeNull();
    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN]);
  });
});
