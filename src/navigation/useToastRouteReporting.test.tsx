import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { act, render, screen } from '@testing-library/react-native';

import { withSheetHost } from '@components/ConfirmationSheet/testing';
import type { ToastTicket } from '@components/Toast';
import { ToastHost, ToastProvider, useToastControl } from '@components/Toast';
import { useToast } from '@hooks';
import { createAppStore } from '@redux/Store';
import { ScreenNames } from '@shared/enums';
import type { MainTabParamList, RootStackParamList } from '@shared/types';

import useToastRouteReporting from './useToastRouteReporting';

jest.useFakeTimers();

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const error = { tone: 'error', text: 'Couldn’t delete transaction' } as const;
const startWork: Partial<Record<string, () => ToastTicket>> = {};
let reportTabBarHeight: (height: number) => void = () => {};

// A screen whose work, started as a press would start a request, takes its ticket then.
const screenThatWorks = (name: string) =>
  function Screen() {
    const { begin } = useToast();
    const control = useToastControl();
    useEffect(() => {
      startWork[name] = begin;
      reportTabBarHeight = control.reportTabBarHeight;
    });
    return <Text>{name}</Text>;
  };

const HomeTab = screenThatWorks('home');
const HistoryTab = screenThatWorks('history');
const Categories = screenThatWorks('categories');

const Tabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen name={ScreenNames.HOME_TAB} component={HomeTab} />
    <Tab.Screen name={ScreenNames.TRANSACTIONS_TAB} component={HistoryTab} />
  </Tab.Navigator>
);

let navigation: ReturnType<typeof useToastRouteReporting>['navigationRef'];

const Navigator = () => {
  const { navigationRef, reportFocusedRoute } = useToastRouteReporting();
  useEffect(() => {
    navigation = navigationRef;
  });

  return (
    <>
      <NavigationContainer ref={navigationRef} onReady={reportFocusedRoute} onStateChange={reportFocusedRoute}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={ScreenNames.HOME_SCREEN} component={Tabs} />
          <Stack.Screen name={ScreenNames.CATEGORIES_SCREEN} component={Categories} />
        </Stack.Navigator>
      </NavigationContainer>
      <ToastHost />
    </>
  );
};

const renderApp = () =>
  render(
    withSheetHost(
      <Provider store={createAppStore()}>
        <ToastProvider>
          <Navigator />
        </ToastProvider>
      </Provider>,
    ),
  );

const settle = async () => {
  for (let step = 0; step < 6; step += 1) await act(() => jest.advanceTimersByTimeAsync(50));
};

const isShown = () => screen.queryByText(error.text) !== null;

const go = async (name: ScreenNames.TRANSACTIONS_TAB | ScreenNames.HOME_TAB) => {
  act(() => navigation.navigate(ScreenNames.HOME_SCREEN, { screen: name }));
  await settle();
};

it('ends a tab’s toast and work on a tab change, and does not revive them on return', async () => {
  renderApp();
  await settle();
  const homeWork = startWork.home!();
  act(() => homeWork.show(error));
  expect(isShown()).toBe(true);

  await go(ScreenNames.TRANSACTIONS_TAB);
  expect(isShown()).toBe(false);

  await go(ScreenNames.HOME_TAB);
  act(() => homeWork.show(error));
  expect(isShown()).toBe(false);

  act(() => startWork.home!().show(error));
  expect(isShown()).toBe(true);
});

it('ends a toast on a pushed screen and on Back, and gives the tab bar’s place only to tab screens', async () => {
  renderApp();
  await settle();
  act(() => reportTabBarHeight(83));
  act(() => startWork.home!().show(error));
  expect(StyleSheet.flatten(screen.getByTestId('toast-position').props.style)).toMatchObject({ bottom: 95 });

  act(() => navigation.navigate(ScreenNames.CATEGORIES_SCREEN));
  await settle();
  expect(isShown()).toBe(false);

  const categoriesWork = startWork.categories!();
  act(() => categoriesWork.show(error));
  expect(StyleSheet.flatten(screen.getByTestId('toast-position').props.style)).toMatchObject({ bottom: 34 + 12 });

  act(() => navigation.goBack());
  await settle();
  expect(isShown()).toBe(false);

  act(() => categoriesWork.show(error));
  expect(isShown()).toBe(false);
});
