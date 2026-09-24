import { Text } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { NavigationContainer, createNavigationContainerRef, type InitialState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import authReducer from '@redux/state/auth/slice';
import currencyReducer from '@redux/state/currency/slice';
import WelcomeScreen from '@screens/Welcome/WelcomeScreen';
import SignInScreen from '@screens/Auth/Screens/SignIn/SignInScreen';
import SignUpScreen from '@screens/Auth/Screens/SignUp/SignUpScreen';
import VerifyEmailScreen from '@screens/Auth/Screens/VerifyEmail/VerifyEmailScreen';
import RecentActivity from '@screens/Home/components/RecentActivity/RecentActivity';
import ManagementSettingsSection from '@screens/Settings/components/ManagementSettingsSection/ManagementSettingsSection';
import { ScreenNames } from '@shared/enums';
import type { MainTabParamList, MainTabScreenProps, RootStackParamList, RootStackScreenProps } from '@shared/types';

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

jest.mock('@api/currency.api', () => ({ getCurrencies: jest.fn(() => new Promise(() => {})) }));

jest.mock('@hooks', () => ({
  useAlert: () => ({ addAlert: jest.fn() }),
}));

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const rootRoutes = () => navigationRef.getRootState()?.routes ?? [];

const routeNames = () => rootRoutes().map((route) => route.name);

const focusedTab = () => {
  const tabs = rootRoutes().find((route) => route.name === ScreenNames.HOME_SCREEN)?.state;

  return tabs?.index === undefined ? undefined : tabs.routes[tabs.index]?.name;
};

const renderAuthStack = (initialState?: InitialState) => {
  const store = configureStore({ reducer: { auth: authReducer, currency: currencyReducer } });

  render(
    <Provider store={store}>
      <NavigationContainer ref={navigationRef} initialState={initialState}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={ScreenNames.WELCOME_SCREEN} component={WelcomeScreen} />
          <Stack.Screen name={ScreenNames.SIGN_IN_SCREEN} component={SignInScreen} />
          <Stack.Screen name={ScreenNames.SIGN_UP_SCREEN} component={SignUpScreen} />
          <Stack.Screen name={ScreenNames.VERIFY_EMAIL_SCREEN} component={VerifyEmailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>,
  );
};

const pressLast = (text: string) => {
  const matches = screen.getAllByText(text);
  fireEvent.press(matches[matches.length - 1]);
};

describe('auth stack', () => {
  it('pops back to Sign in instead of stacking a second copy', () => {
    renderAuthStack();

    fireEvent.press(screen.getByText('Sign In'));
    pressLast('Sign up');
    expect(routeNames()).toEqual([ScreenNames.WELCOME_SCREEN, ScreenNames.SIGN_IN_SCREEN, ScreenNames.SIGN_UP_SCREEN]);

    pressLast('Sign in');
    expect(routeNames()).toEqual([ScreenNames.WELCOME_SCREEN, ScreenNames.SIGN_IN_SCREEN]);
  });

  it('pops back to Sign up instead of stacking a second copy', () => {
    renderAuthStack();

    fireEvent.press(screen.getByText('Create account'));
    pressLast('Sign in');
    pressLast('Sign up');

    expect(routeNames()).toEqual([ScreenNames.WELCOME_SCREEN, ScreenNames.SIGN_UP_SCREEN]);
  });

  it('pops Verify Email back to an existing Sign in', () => {
    renderAuthStack({
      index: 3,
      routes: [
        { name: ScreenNames.WELCOME_SCREEN },
        { name: ScreenNames.SIGN_IN_SCREEN },
        { name: ScreenNames.SIGN_UP_SCREEN },
        { name: ScreenNames.VERIFY_EMAIL_SCREEN },
      ],
    });

    pressLast('Sign in');

    expect(routeNames()).toEqual([ScreenNames.WELCOME_SCREEN, ScreenNames.SIGN_IN_SCREEN]);
  });

  it('pushes Sign in from Verify Email when it is not in the stack yet', () => {
    renderAuthStack({
      index: 2,
      routes: [
        { name: ScreenNames.WELCOME_SCREEN },
        { name: ScreenNames.SIGN_UP_SCREEN },
        { name: ScreenNames.VERIFY_EMAIL_SCREEN },
      ],
    });

    pressLast('Sign in');

    expect(routeNames()).toEqual([
      ScreenNames.WELCOME_SCREEN,
      ScreenNames.SIGN_UP_SCREEN,
      ScreenNames.VERIFY_EMAIL_SCREEN,
      ScreenNames.SIGN_IN_SCREEN,
    ]);
  });
});

const HomeTab = ({ navigation }: MainTabScreenProps<ScreenNames.HOME_TAB>) => (
  <RecentActivity
    navigation={navigation}
    transactions={[]}
    hasWallets
    isLoading={false}
    hasError={false}
    onRetry={jest.fn()}
  />
);

const SettingsTab = ({ navigation }: MainTabScreenProps<ScreenNames.SETTINGS_TAB>) => (
  <ManagementSettingsSection navigation={navigation} categoriesLabel="3 categories" walletsLabel="1 wallet" />
);

const TransactionsTab = () => <Text>Transactions tab</Text>;
const LimitsTab = () => <Text>Limits tab</Text>;

const CategoriesStub = ({ navigation }: RootStackScreenProps<ScreenNames.CATEGORIES_SCREEN>) => (
  <Text onPress={() => navigation.goBack()}>Categories screen</Text>
);

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name={ScreenNames.HOME_TAB} component={HomeTab} />
    <Tab.Screen name={ScreenNames.TRANSACTIONS_TAB} component={TransactionsTab} />
    <Tab.Screen name={ScreenNames.LIMITS_TAB} component={LimitsTab} />
    <Tab.Screen name={ScreenNames.SETTINGS_TAB} component={SettingsTab} />
  </Tab.Navigator>
);

const renderSignedIn = () =>
  render(
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ScreenNames.HOME_SCREEN} component={MainTabs} />
        <Stack.Screen name={ScreenNames.CATEGORIES_SCREEN} component={CategoriesStub} />
      </Stack.Navigator>
    </NavigationContainer>,
  );

describe('signed-in navigation', () => {
  it('switches to the History tab from "See all"', () => {
    renderSignedIn();

    fireEvent.press(screen.getByText('See all'));

    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN]);
    expect(focusedTab()).toBe(ScreenNames.TRANSACTIONS_TAB);
  });

  it('opens a root stack screen from a tab and goes back to that tab', () => {
    renderSignedIn();

    act(() => navigationRef.navigate(ScreenNames.HOME_SCREEN, { screen: ScreenNames.SETTINGS_TAB }));
    expect(focusedTab()).toBe(ScreenNames.SETTINGS_TAB);

    fireEvent.press(screen.getByText('Categories'));
    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN, ScreenNames.CATEGORIES_SCREEN]);

    fireEvent.press(screen.getByText('Categories screen'));
    expect(routeNames()).toEqual([ScreenNames.HOME_SCREEN]);
    expect(focusedTab()).toBe(ScreenNames.SETTINGS_TAB);
  });
});
