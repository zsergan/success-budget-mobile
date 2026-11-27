import type { RefObject } from 'react';
import { useCallback, useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { RefreshControl } from 'react-native';
import type { EventArg, NavigationProp, ParamListBase } from '@react-navigation/native';
import { NavigationContext, NavigationRouteContext } from '@react-navigation/native';

import useTheme from './useTheme';

// A ScrollView, or a FlatList / SectionList that hands one out.
interface Scrollable {
  scrollTo?: (options: { y: number; animated: boolean }) => void;
  getScrollResponder?: () => { scrollTo?: (options: { y: number; animated: boolean }) => void } | null | undefined;
}

interface Options {
  // A ScrollView, FlatList or SectionList.
  scrollRef: RefObject<object | null>;
  // Asks for the screen's data again; omitted, the screen takes no pull and its tab only scrolls it up.
  refresh?: () => void;
  // While the screen's data is being asked for.
  isBusy?: boolean;
}

const TOP_SLACK = 2;
// A refresh that never got busy (all of it answered from cache at once) still shows its spinner this long.
const SETTLE_MS = 800;
// Pulls and tab taps this soon after the last refresh ask for nothing; a pull only shows its spinner.
export const REFRESH_COOLDOWN_MS = 5000;

type Phase = 'idle' | 'asked' | 'busy';

const scrollToTop = (ref: object | null) => {
  const node = ref as Scrollable | null;
  const target = node?.scrollTo ? node : node?.getScrollResponder?.();
  target?.scrollTo?.({ y: 0, animated: true });
};

const tabNavigatorsOf = (navigation: NavigationProp<ParamListBase> | undefined) => {
  const tabs: NavigationProp<ParamListBase>[] = [];
  for (let current = navigation; current; current = current.getParent()) {
    if (current.getState()?.type === 'tab') tabs.push(current);
  }
  return tabs;
};

// Pull down to ask for the data again. A tap on the shown tab scrolls its first screen up, or refreshes it when it is
// already at the top; on a screen pushed over that one the tap is the stack's, which goes back to it.
const useScreenRefresh = ({ scrollRef, refresh, isBusy = false }: Options) => {
  const { colors } = useTheme().colorTheme;
  const navigation = useContext(NavigationContext);
  const route = useContext(NavigationRouteContext);
  const offsetRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('idle');

  if (phase === 'asked' && isBusy) setPhase('busy');
  if (phase === 'busy' && !isBusy) setPhase('idle');

  useEffect(() => {
    if (phase !== 'asked') return;

    const timer = setTimeout(() => setPhase((current) => (current === 'asked' ? 'idle' : current)), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const lastRefreshAtRef = useRef(-Infinity);
  const isRefreshing = phase !== 'idle' || isBusy;

  const canAsk = () => !!refresh && !isRefreshing && Date.now() - lastRefreshAtRef.current >= REFRESH_COOLDOWN_MS;
  const ask = () => {
    lastRefreshAtRef.current = Date.now();
    setPhase('asked');
    refresh?.();
  };

  // A pull always gets its spinner back, so the list never hangs pulled down.
  const onRefresh = () => {
    if (canAsk()) ask();
    else if (refresh) setPhase((current) => (current === 'idle' ? 'asked' : current));
  };

  const onTabPress = useEffectEvent((event: EventArg<'tabPress', true>) => {
    if (!navigation?.isFocused()) return;

    const isFirst = navigation.getState()?.type === 'tab' || navigation.getState()?.routes[0]?.key === route?.key;
    if (!isFirst) return;

    // In the next frame, once every listener has had the event and could have prevented it.
    requestAnimationFrame(() => {
      if (event.defaultPrevented) return;

      if (offsetRef.current > TOP_SLACK) scrollToTop(scrollRef.current);
      else if (canAsk()) ask();
    });
  });

  useEffect(() => {
    const unsubscribers = tabNavigatorsOf(navigation).map((tab) =>
      tab.addListener('tabPress' as never, (event: EventArg<'tabPress', true>) => onTabPress(event)),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [navigation]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const refreshControl = refresh ? (
    <RefreshControl refreshing={phase !== 'idle'} onRefresh={onRefresh} tintColor={colors.muted} />
  ) : undefined;

  return { refreshControl, onScroll, scrollEventThrottle: 16 };
};

export default useScreenRefresh;
