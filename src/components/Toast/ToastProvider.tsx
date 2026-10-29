import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAppStore } from '@redux/hooks';
import type { RootState } from '@redux/Store';

import { registerToastBridge } from './globalToast';
import type { ShownToast, ToastMessage, ToastTicket } from './message';
import { INACTIVE_TICKET, isSameToast } from './message';
import { canReplaceToast, toastDuration } from './policy';

// How soon the navigation a handed-off result leads to must follow, so a navigation that never came cannot carry it
// to whatever screen opens next.
const HANDOFF_MS = 1000;

interface ToastControl {
  // `routeKey` is the caller's screen: a screen out of focus gets an inactive ticket.
  begin(routeKey?: string): ToastTicket;
  // The keys from the root route to the focused one, and whether the tab bar is on screen.
  reportRoute(path: string[], hasTabBar: boolean): void;
  reportTabBarHeight(height: number): void;
  // Marks a sheet on screen, its closing included; returns its removal.
  trackSheet(): () => void;
}

export interface ToastView {
  toast: ShownToast | null;
  isSheetShown: boolean;
  // Null while no tab bar is on screen, or before it was measured.
  tabBarHeight: number | null;
  dismiss(id: number): void;
  act(id: number): void;
  pause(id: number): void;
  resume(id: number): void;
}

const ToastControlContext = createContext<ToastControl>({
  begin: () => INACTIVE_TICKET,
  reportRoute: () => {},
  reportTabBarHeight: () => {},
  trackSheet: () => () => {},
});

export const ToastViewContext = createContext<ToastView>({
  toast: null,
  isSheetShown: false,
  tabBarHeight: null,
  dismiss: () => {},
  act: () => {},
  pause: () => {},
  resume: () => {},
});

export const useToastControl = () => useContext(ToastControlContext);

interface Timer {
  id: number;
  remaining: number;
  startedAt: number;
  handle: ReturnType<typeof setTimeout> | null;
}

interface Pending {
  message: ToastMessage;
  owner: number;
  trigger: 'sheets' | 'navigation';
  expiresAt: number;
}

interface Scope {
  sessionKey: number;
  spaceId: number | null;
}

interface ExpectedSwitch extends Scope {
  owner: number;
  // The owner the expected switch started, once it has happened.
  next: number | null;
}

const scopeOf = ({ auth, space }: RootState): Scope => ({
  sessionKey: auth.sessionKey,
  spaceId: space.currentSpaceId,
});

// The one toast of the app: what it shows, for how long, and whose it is. A message belongs to the screen occurrence,
// session, space and foreground period it was asked in, and nothing of it outlives them.
const ToastProvider = ({ children }: { children: ReactNode }) => {
  const store = useAppStore();
  const ownerRef = useRef(0);
  const routePathRef = useRef<string[]>([]);
  const toastRef = useRef<ShownToast | null>(null);
  const timerRef = useRef<Timer | null>(null);
  const pendingRef = useRef<Pending | null>(null);
  const expectedSwitchRef = useRef<ExpectedSwitch | null>(null);
  const sheetCountRef = useRef(0);
  const nextIdRef = useRef(1);
  const [toast, setToastState] = useState<ShownToast | null>(null);
  const [isSheetShown, setSheetShown] = useState(false);
  const [hasTabBar, setHasTabBar] = useState(false);
  const [tabBarHeight, setTabBarHeight] = useState<number | null>(null);

  const [lifecycle] = useState(() => {
    const setToast = (next: ShownToast | null) => {
      toastRef.current = next;
      setToastState(next);
    };

    const stopTimer = () => {
      if (timerRef.current?.handle) clearTimeout(timerRef.current.handle);
      timerRef.current = null;
    };

    const hide = (id?: number) => {
      const current = toastRef.current;
      if (!current || (id !== undefined && current.id !== id)) return;

      stopTimer();
      setToast(null);
    };

    const runTimer = (timer: Timer) => {
      timer.startedAt = Date.now();
      timer.handle = setTimeout(() => {
        if (timerRef.current === timer) hide(timer.id);
      }, timer.remaining);
    };

    const startTimer = (shown: ShownToast) => {
      stopTimer();
      const duration = toastDuration(shown);
      if (duration === null) return;

      const timer: Timer = { id: shown.id, remaining: duration, startedAt: 0, handle: null };
      timerRef.current = timer;
      runTimer(timer);
    };

    const present = (message: ToastMessage, owner: number) => {
      if (owner !== ownerRef.current) return;

      const current = toastRef.current;
      const shown: ShownToast = { ...message, id: nextIdRef.current, owner };

      if (current && isSameToast(current, shown)) {
        const kept = { ...shown, id: current.id };
        setToast(kept);
        startTimer(kept);
        return;
      }
      if (current && !canReplaceToast(current, message)) return;

      nextIdRef.current += 1;
      setToast(shown);
      startTimer(shown);
    };

    const hold = (pending: Pending) => {
      const held = pendingRef.current;
      if (held && held.owner === pending.owner && !canReplaceToast(held.message, pending.message)) return;

      pendingRef.current = pending;
    };

    const endOwner = (byNavigation: boolean) => {
      const ended = ownerRef.current;
      ownerRef.current += 1;
      hide();

      const pending = pendingRef.current;
      pendingRef.current = null;
      if (
        byNavigation &&
        pending?.trigger === 'navigation' &&
        pending.owner === ended &&
        Date.now() <= pending.expiresAt
      ) {
        // Accepted for the destination; a sheet still closing (the one the result came from) is waited out.
        if (sheetCountRef.current === 0) present(pending.message, ownerRef.current);
        else pendingRef.current = { ...pending, owner: ownerRef.current, trigger: 'sheets', expiresAt: Infinity };
      }
    };

    const resolve = (subject: string, owner: number) => {
      if (owner !== ownerRef.current) return;

      if (toastRef.current?.subject === subject) hide();
      if (pendingRef.current?.message.subject === subject) pendingRef.current = null;
    };

    const ticketFor = (ownerOf: () => number): ToastTicket => {
      const isCurrent = () => ownerOf() === ownerRef.current;

      return {
        isCurrent,
        show: (message) => present(message, ownerOf()),
        showAfterSheetsClose: (message) => {
          if (!isCurrent()) return;
          if (sheetCountRef.current === 0) present(message, ownerOf());
          else hold({ message, owner: ownerOf(), trigger: 'sheets', expiresAt: Infinity });
        },
        showAfterNavigation: (message) => {
          if (isCurrent()) {
            hold({ message, owner: ownerOf(), trigger: 'navigation', expiresAt: Date.now() + HANDOFF_MS });
          }
        },
        resolve: (subject) => resolve(subject, ownerOf()),
        expectSpaceSwitch: () => {
          if (!isCurrent()) return INACTIVE_TICKET;

          const expected: ExpectedSwitch = { ...scopeOf(store.getState()), owner: ownerOf(), next: null };
          expectedSwitchRef.current = expected;
          return ticketFor(() => expected.next ?? -1);
        },
      };
    };

    const begin = (routeKey?: string): ToastTicket => {
      const owner = routeKey === undefined || routePathRef.current.includes(routeKey) ? ownerRef.current : -1;
      return ticketFor(() => owner);
    };

    // Any change of session or space ends the owner; only the one switch a ticket expected carries it on.
    const changeScope = (from: Scope, to: Scope) => {
      const expected = expectedSwitchRef.current;
      expectedSwitchRef.current = null;
      const isExpected =
        expected?.owner === ownerRef.current &&
        expected.sessionKey === from.sessionKey &&
        expected.spaceId === from.spaceId &&
        to.sessionKey === from.sessionKey;

      endOwner(false);
      if (isExpected) expected.next = ownerRef.current;
    };

    const reportRoute = (path: string[], isTabBarShown: boolean) => {
      const previous = routePathRef.current;
      routePathRef.current = path;
      setHasTabBar(isTabBarShown);
      if (path[path.length - 1] !== previous[previous.length - 1]) endOwner(true);
    };

    const trackSheet = () => {
      sheetCountRef.current += 1;
      setSheetShown(true);
      let isTracked = true;

      return () => {
        if (!isTracked) return;
        isTracked = false;
        sheetCountRef.current -= 1;
        if (sheetCountRef.current > 0) return;

        setSheetShown(false);
        const pending = pendingRef.current;
        if (pending?.trigger !== 'sheets') return;

        pendingRef.current = null;
        present(pending.message, pending.owner);
      };
    };

    const pause = (id: number) => {
      const timer = timerRef.current;
      if (timer?.id !== id || timer.handle === null) return;

      clearTimeout(timer.handle);
      timer.handle = null;
      timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    };

    const resume = (id: number) => {
      const timer = timerRef.current;
      if (timer?.id === id && timer.handle === null) runTimer(timer);
    };

    // One run of the action: the toast is gone before it starts, so a second tap finds nothing to act on.
    const act = (id: number) => {
      const current = toastRef.current;
      if (current?.id !== id || !current.action) return;

      hide(id);
      current.action.onPress();
    };

    return { begin, reportRoute, trackSheet, changeScope, endOwner, hide, pause, resume, act, stopTimer };
  });

  useEffect(() => {
    let scope = scopeOf(store.getState());

    return store.subscribe(() => {
      const next = scopeOf(store.getState());
      if (next.sessionKey === scope.sessionKey && next.spaceId === scope.spaceId) return;

      const previous = scope;
      scope = next;
      lifecycle.changeScope(previous, next);
    });
  }, [store, lifecycle]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') lifecycle.endOwner(false);
    });

    return () => subscription.remove();
  }, [lifecycle]);

  useEffect(() => registerToastBridge(() => lifecycle.begin()), [lifecycle]);

  useEffect(() => lifecycle.stopTimer, [lifecycle]);

  const control = useMemo<ToastControl>(
    () => ({
      begin: lifecycle.begin,
      reportRoute: lifecycle.reportRoute,
      reportTabBarHeight: setTabBarHeight,
      trackSheet: lifecycle.trackSheet,
    }),
    [lifecycle],
  );

  const view = useMemo<ToastView>(
    () => ({
      toast,
      isSheetShown,
      tabBarHeight: hasTabBar ? tabBarHeight : null,
      dismiss: lifecycle.hide,
      act: lifecycle.act,
      pause: lifecycle.pause,
      resume: lifecycle.resume,
    }),
    [toast, isSheetShown, hasTabBar, tabBarHeight, lifecycle],
  );

  return (
    <ToastControlContext.Provider value={control}>
      <ToastViewContext.Provider value={view}>{children}</ToastViewContext.Provider>
    </ToastControlContext.Provider>
  );
};

// Marks the sheet it is rendered in as on screen, from its presentation until its closing animation ends.
export const ToastSheetPresence = () => {
  const { trackSheet } = useToastControl();
  useEffect(() => trackSheet(), [trackSheet]);

  return null;
};

export default ToastProvider;
