import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import useScreenRefresh, { REFRESH_COOLDOWN_MS } from './useScreenRefresh';

const Tab = createBottomTabNavigator();
const refresh = jest.fn();
const scrollTo = jest.fn();
const busy: { set?: (isBusy: boolean) => void } = {};

const ListScreen = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [isBusy, setIsBusy] = useState(false);
  useEffect(() => {
    busy.set = setIsBusy;
  }, []);
  const screenRefresh = useScreenRefresh({ scrollRef, refresh, isBusy });

  return (
    <ScrollView ref={scrollRef} testID="list" {...screenRefresh}>
      <Text>Rows</Text>
    </ScrollView>
  );
};

const OtherScreen = () => <Text>Other</Text>;

const renderTabs = () => {
  const view = render(
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="List" component={ListScreen} />
        <Tab.Screen name="Other" component={OtherScreen} />
      </Tab.Navigator>
    </NavigationContainer>,
  );
  jest.spyOn(screen.UNSAFE_getByType(ScrollView).instance, 'scrollTo').mockImplementation(scrollTo);
  return view;
};

const list = () => screen.getByTestId('list');
const scrollBy = (y: number) => fireEvent.scroll(list(), { nativeEvent: { contentOffset: { x: 0, y } } });
const tapTab = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

beforeEach(() => {
  refresh.mockReset();
  scrollTo.mockReset();
});

it('scrolls up on a tap of its tab, and refreshes on a tap with the list already at the top', async () => {
  renderTabs();

  scrollBy(400);
  tapTab('List');
  await nextFrame();
  expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  expect(refresh).not.toHaveBeenCalled();

  scrollBy(0);
  tapTab('List');
  await nextFrame();
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(scrollTo).toHaveBeenCalledTimes(1);
});

it('only switches to the tab when another one is shown', async () => {
  renderTabs();

  tapTab('Other');
  await nextFrame();
  tapTab('List');
  await nextFrame();

  expect(refresh).not.toHaveBeenCalled();
  expect(scrollTo).not.toHaveBeenCalled();
});

it('shows the pull spinner until the data it asked for has come back', () => {
  jest.useFakeTimers();
  renderTabs();
  const spinner = () => list().props.refreshControl.props.refreshing;

  act(() => list().props.refreshControl.props.onRefresh());
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(spinner()).toBe(true);

  act(() => busy.set?.(true));
  // Past the fallback for a refresh answered at once: it waits for the request instead.
  act(() => jest.advanceTimersByTime(5000));
  expect(spinner()).toBe(true);

  act(() => busy.set?.(false));
  expect(spinner()).toBe(false);
  jest.useRealTimers();
});

it('hides the pull spinner shortly when nothing had to be asked for', () => {
  jest.useFakeTimers();
  renderTabs();
  const spinner = () => list().props.refreshControl.props.refreshing;

  act(() => list().props.refreshControl.props.onRefresh());
  expect(spinner()).toBe(true);

  act(() => jest.advanceTimersByTime(1000));
  expect(spinner()).toBe(false);
  jest.useRealTimers();
});

it('asks once for a burst of tab taps at the top, and again only after the cooldown', async () => {
  renderTabs();
  const now = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

  for (let tap = 0; tap < 5; tap += 1) {
    tapTab('List');
    await nextFrame();
  }
  expect(refresh).toHaveBeenCalledTimes(1);

  now.mockReturnValue(1_000_000 + REFRESH_COOLDOWN_MS - 1);
  await act(() => new Promise((resolve) => setTimeout(resolve, 900)));
  tapTab('List');
  await nextFrame();
  expect(refresh).toHaveBeenCalledTimes(1);

  now.mockReturnValue(1_000_000 + REFRESH_COOLDOWN_MS);
  tapTab('List');
  await nextFrame();
  expect(refresh).toHaveBeenCalledTimes(2);
  now.mockRestore();
});

it('gives a pull during the cooldown its spinner back without asking again', () => {
  jest.useFakeTimers();
  renderTabs();
  const spinner = () => list().props.refreshControl.props.refreshing;
  const pull = () => act(() => list().props.refreshControl.props.onRefresh());

  pull();
  act(() => jest.advanceTimersByTime(1000));
  pull();
  expect(spinner()).toBe(true);
  act(() => jest.advanceTimersByTime(1000));

  expect(spinner()).toBe(false);
  expect(refresh).toHaveBeenCalledTimes(1);

  act(() => jest.advanceTimersByTime(REFRESH_COOLDOWN_MS));
  pull();
  expect(refresh).toHaveBeenCalledTimes(2);
  jest.useRealTimers();
});
