import { useEffect, useState } from 'react';
import type { AppStateStatus, KeyboardEvent, KeyboardEventName } from 'react-native';
import { AppState, Keyboard, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { finishDismissals, holdDismissals, resetSheets, withSheetHost } from '@components/ConfirmationSheet/testing';
import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import type { Confirmation } from '@components/ConfirmationSheet/ConfirmationSheet';
import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import { beginToast } from './globalToast';
import type { ToastMessage, ToastTicket } from './message';
import ToastHost from './ToastHost/ToastHost';
import ToastProvider, { useToastControl } from './ToastProvider';

jest.mock('@gorhom/bottom-sheet', () => jest.requireActual('@components/ConfirmationSheet/testing').bottomSheetMock);
jest.mock(
  '@components/Modals/BottomSheetModal/useReturnToRest',
  () => jest.requireActual('@components/ConfirmationSheet/testing').useReturnToRestMock,
);

jest.useFakeTimers();

let changeAppState: (state: AppStateStatus) => void = () => {};
const keyboardListeners = new Map<KeyboardEventName, (event: KeyboardEvent) => void>();

beforeEach(() => {
  resetSheets();
  keyboardListeners.clear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    changeAppState = listener;
    return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
  });
  jest.spyOn(Keyboard, 'metrics').mockReturnValue(undefined);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((name, listener) => {
    keyboardListeners.set(name, listener);
    return { remove: () => {} } as ReturnType<typeof Keyboard.addListener>;
  });
});

afterEach(() => jest.restoreAllMocks());

let control: ReturnType<typeof useToastControl>;
let openSheet: (confirmation: Confirmation | null) => void;
let openSecondSheet: (confirmation: Confirmation | null) => void;

const Harness = () => {
  const toastControl = useToastControl();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [second, setSecond] = useState<Confirmation | null>(null);
  useEffect(() => {
    control = toastControl;
    openSheet = setConfirmation;
    openSecondSheet = setSecond;
  }, [toastControl]);

  return (
    <>
      <ConfirmationSheet confirmation={confirmation} />
      <ConfirmationSheet confirmation={second} />
      <ToastHost />
    </>
  );
};

const renderToasts = () => {
  const store = createAppStore();
  render(
    withSheetHost(
      <Provider store={store}>
        <ToastProvider>
          <Harness />
        </ToastProvider>
      </Provider>,
    ),
  );
  act(() => control.reportRoute(['root', 'screen-a'], false));

  return store;
};

// In steps, so what a timer sets off (an exit animation) renders and runs within the same stretch of time.
const elapse = async (ms: number) => {
  for (let passed = 0; passed < ms; passed += 50) {
    await act(() => jest.advanceTimersByTimeAsync(Math.min(50, ms - passed)));
  }
};
const show = (ticket: ToastTicket, message: ToastMessage) => act(() => ticket.show(message));
// Called directly: Testing Library holds back touch events from a view whose responder check says no, which the
// platform still delivers.
const touchSwipeArea = (handler: string, event: object = { nativeEvent: {} }) =>
  act(() => screen.getByTestId('toast-swipe').props[handler](event));
const isShown = (text: string) => screen.queryByText(text) !== null;
const placement = () => StyleSheet.flatten(screen.getByTestId('toast-position').props.style);

const success: ToastMessage = { tone: 'success', text: 'Transaction deleted' };
const info: ToastMessage = { tone: 'info', text: 'This transaction was already deleted' };
const retry = jest.fn();
const error: ToastMessage = {
  tone: 'error',
  text: 'Couldn’t delete transaction',
  subject: 'delete:1',
  action: { label: 'Retry', onPress: retry },
};
const warning: ToastMessage = {
  tone: 'warning',
  text: 'Not deleted — this transaction changed',
  action: { label: 'View', onPress: jest.fn() },
};

const confirmation: Confirmation = {
  title: 'Delete transaction?',
  description: 'It can’t be restored.',
  primaryAction: { label: 'Delete transaction', tone: 'danger', onPress: () => {} },
  onCancel: () => {},
};

describe('timing', () => {
  it('closes success and info by themselves after 4 s', async () => {
    renderToasts();
    await show(control.begin(), success);

    await elapse(3900);
    expect(isShown(success.text)).toBe(true);

    await elapse(400);
    expect(isShown(success.text)).toBe(false);
  });

  it('gives a long message more time and one with an action 8 s', async () => {
    renderToasts();
    const long = { tone: 'info', text: 'One two three four five six seven eight nine ten eleven twelve.' } as const;
    await show(control.begin(), long);

    await elapse(4900);
    expect(isShown(long.text)).toBe(true);
    await elapse(400);
    expect(isShown(long.text)).toBe(false);

    await show(control.begin(), warning);
    await elapse(7900);
    expect(isShown(warning.text)).toBe(true);
    await elapse(400);
    expect(isShown(warning.text)).toBe(false);
  });

  it('keeps an error until it is closed', async () => {
    renderToasts();
    await show(control.begin(), error);

    await elapse(60_000);
    expect(isShown(error.text)).toBe(true);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await elapse(300);
    expect(isShown(error.text)).toBe(false);
    expect(retry).not.toHaveBeenCalled();
  });

  it('pauses while touched and resumes with the time that was left', async () => {
    renderToasts();
    await show(control.begin(), success);
    await elapse(3000);

    touchSwipeArea('onTouchStart');
    await elapse(10_000);
    expect(isShown(success.text)).toBe(true);

    touchSwipeArea('onTouchEnd');
    await elapse(900);
    expect(isShown(success.text)).toBe(true);
    await elapse(400);
    expect(isShown(success.text)).toBe(false);
  });
});

describe('replacement', () => {
  it('keeps one toast for a repeated message and restarts its timer', async () => {
    renderToasts();
    const ticket = control.begin();
    await show(ticket, success);
    await elapse(3000);

    await show(ticket, success);
    expect(screen.getAllByText(success.text)).toHaveLength(1);
    await elapse(3000);
    expect(isShown(success.text)).toBe(true);
    await elapse(1300);
    expect(isShown(success.text)).toBe(false);
  });

  it('never lets a message push out one that asks more of the user, and drops what it held back', async () => {
    renderToasts();
    const ticket = control.begin();

    await show(ticket, success);
    await show(ticket, warning);
    await elapse(300);
    expect([isShown(success.text), isShown(warning.text)]).toEqual([false, true]);

    await show(ticket, info);
    expect(isShown(warning.text)).toBe(true);

    await show(ticket, error);
    await elapse(300);
    expect([isShown(warning.text), isShown(error.text)]).toEqual([false, true]);

    await show(ticket, warning);
    await show(ticket, success);
    expect(isShown(error.text)).toBe(true);

    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await elapse(10_000);
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('lets a result take away its own error before showing what came of it', async () => {
    renderToasts();
    const ticket = control.begin();
    await show(ticket, error);

    await act(() => {
      ticket.resolve('delete:1');
      ticket.show(success);
    });
    await elapse(300);

    expect([isShown(error.text), isShown(success.text)]).toEqual([false, true]);
  });

  it('replaces success with success at once', async () => {
    renderToasts();
    const ticket = control.begin();
    await show(ticket, success);
    await show(ticket, info);
    await elapse(300);

    expect([isShown(success.text), isShown(info.text)]).toEqual([false, true]);
  });
});

describe('actions and gestures', () => {
  it('runs the action once, however fast it is tapped again, and closes the toast', async () => {
    renderToasts();
    await show(control.begin(), error);

    const button = screen.getByRole('button', { name: 'Retry' });
    fireEvent.press(button);
    fireEvent.press(button);
    await elapse(300);

    expect(retry).toHaveBeenCalledTimes(1);
    expect(isShown(error.text)).toBe(false);
  });

  const touch = (x: number, y: number, timestamp: number) => ({
    nativeEvent: {},
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: timestamp,
      touchBank: [
        {
          touchActive: true,
          startPageX: 0,
          startPageY: 0,
          startTimeStamp: 0,
          currentPageX: x,
          currentPageY: y,
          currentTimeStamp: timestamp,
          previousPageX: 0,
          previousPageY: 0,
          previousTimeStamp: 0,
        },
      ],
    },
  });

  const drag = (dx: number, dy: number) => {
    touchSwipeArea('onResponderGrant', touch(0, 0, 0));
    touchSwipeArea('onResponderMove', touch(dx, dy, 1000));
    touchSwipeArea('onResponderRelease', touch(dx, dy, 1000));
  };

  it('closes on a swipe away, even an error, and settles back after a short drag', async () => {
    renderToasts();
    await show(control.begin(), error);

    drag(20, 10);
    await elapse(1000);
    expect(isShown(error.text)).toBe(true);

    drag(0, 40);
    await elapse(300);
    expect(isShown(error.text)).toBe(false);

    await show(control.begin(), success);
    await elapse(300);
    drag(-120, 0);
    await elapse(300);
    expect(isShown(success.text)).toBe(false);
  });

  it('does not let a toast that was leaving take away the one shown after it', async () => {
    renderToasts();
    await show(control.begin(), error);
    fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    await elapse(60);

    await show(control.begin(), info);
    await elapse(1000);

    expect(isShown(info.text)).toBe(true);
    expect(isShown(error.text)).toBe(false);
  });
});

describe('ownership', () => {
  it('ends a screen’s toast and its work when the user leaves it, and does not revive them on return', async () => {
    renderToasts();
    const ticket = control.begin();
    await show(ticket, error);

    act(() => control.reportRoute(['root', 'screen-b'], false));
    await elapse(300);
    expect(isShown(error.text)).toBe(false);

    act(() => control.reportRoute(['root', 'screen-a'], false));
    await show(ticket, error);
    expect(ticket.isCurrent()).toBe(false);
    expect(isShown(error.text)).toBe(false);
  });

  it('keeps a toast while the focused screen stays, and gives a screen out of focus nothing', async () => {
    renderToasts();
    await show(control.begin(), error);

    act(() => control.reportRoute(['root', 'screen-a'], true));
    expect(isShown(error.text)).toBe(true);

    await show(control.begin('screen-b'), info);
    expect(isShown(info.text)).toBe(false);
    expect(control.begin('root').isCurrent()).toBe(true);
  });

  it('ends everything when the app goes to the background', async () => {
    renderToasts();
    const ticket = control.begin();
    await show(ticket, error);

    act(() => changeAppState('background'));
    await elapse(300);
    act(() => changeAppState('active'));
    await show(ticket, error);

    expect(isShown(error.text)).toBe(false);
  });

  it('ends everything on a space switch, even back to the same space', async () => {
    const store = renderToasts();
    act(() => {
      store.dispatch(activateSpace(1));
    });
    const ticket = control.begin();
    await show(ticket, error);

    act(() => {
      store.dispatch(activateSpace(2));
    });
    act(() => {
      store.dispatch(activateSpace(1));
    });
    await elapse(300);
    await show(ticket, error);

    expect(isShown(error.text)).toBe(false);
  });

  it('ends everything when the session ends', async () => {
    const store = renderToasts();
    const ticket = control.begin();
    await show(ticket, error);

    act(() => {
      store.dispatch({ type: logoutMe.fulfilled.type });
    });
    await elapse(300);
    await show(ticket, error);

    expect(isShown(error.text)).toBe(false);
  });

  it('gives code outside React the same rules through the bridge', async () => {
    renderToasts();
    const ticket = beginToast();
    await show(ticket, error);
    expect(isShown(error.text)).toBe(true);

    act(() => control.reportRoute(['root', 'screen-b'], false));
    await elapse(300);
    await show(ticket, error);
    expect(isShown(error.text)).toBe(false);
  });
});

describe('handoff', () => {
  it('shows a result on the screen its navigation leads to', async () => {
    renderToasts();
    act(() => control.begin().showAfterNavigation(success));
    expect(isShown(success.text)).toBe(false);

    act(() => control.reportRoute(['root', 'screen-b'], false));
    await elapse(300);
    expect(isShown(success.text)).toBe(true);
  });

  it('drops it when that navigation does not follow at once, or the space changes instead', async () => {
    const store = renderToasts();
    act(() => control.begin().showAfterNavigation(success));
    await elapse(1500);
    act(() => control.reportRoute(['root', 'screen-b'], false));
    await elapse(300);
    expect(isShown(success.text)).toBe(false);

    act(() => control.begin().showAfterNavigation(success));
    act(() => {
      store.dispatch(activateSpace(3));
    });
    act(() => control.reportRoute(['root', 'screen-c'], false));
    await elapse(300);
    expect(isShown(success.text)).toBe(false);
  });

  describe('from a sheet still closing', () => {
    // The result is asked for as the sheet starts closing, and its navigation follows at once.
    const closeAndNavigate = (route = 'screen-b') => {
      holdDismissals();
      act(() => {
        openSheet(null);
        control.begin().showAfterNavigation(success);
      });
      act(() => control.reportRoute(['root', route], false));
    };

    it('waits for the close, however long it takes, then shows it once at the bottom', async () => {
      renderToasts();
      act(() => openSheet(confirmation));

      closeAndNavigate();
      await elapse(1500);
      expect(isShown(success.text)).toBe(false);

      finishDismissals();
      await elapse(300);
      expect(screen.getAllByText(success.text)).toHaveLength(1);
      expect(placement()).toMatchObject({ bottom: 34 + 12 });
    });

    it('waits for every sheet in a stack', async () => {
      renderToasts();
      act(() => openSheet(confirmation));
      act(() => openSecondSheet({ ...confirmation, title: 'Second' }));

      holdDismissals();
      act(() => {
        openSecondSheet(null);
        control.begin().showAfterNavigation(success);
      });
      act(() => control.reportRoute(['root', 'screen-b'], false));
      finishDismissals();
      await elapse(300);
      expect(isShown(success.text)).toBe(false);

      act(() => openSheet(null));
      await elapse(300);
      expect(isShown(success.text)).toBe(true);
    });

    it('drops it when the destination is left, or the space changes, before the close ends', async () => {
      const store = renderToasts();
      act(() => openSheet(confirmation));
      closeAndNavigate();
      act(() => control.reportRoute(['root', 'screen-c'], false));
      finishDismissals();
      await elapse(300);
      expect(isShown(success.text)).toBe(false);

      act(() => openSheet(confirmation));
      closeAndNavigate('screen-d');
      act(() => {
        store.dispatch(activateSpace(4));
      });
      finishDismissals();
      await elapse(300);
      expect(isShown(success.text)).toBe(false);
    });
  });

  it('carries a result across the space switch its own work expected, then its navigation', async () => {
    const store = renderToasts();
    act(() => {
      store.dispatch(activateSpace(1));
    });
    const ticket = control.begin();
    const afterSwitch = ticket.expectSpaceSwitch();
    expect(afterSwitch.isCurrent()).toBe(false);

    act(() => {
      store.dispatch(activateSpace(2));
    });
    expect(ticket.isCurrent()).toBe(false);
    expect(afterSwitch.isCurrent()).toBe(true);

    act(() => afterSwitch.showAfterNavigation(success));
    act(() => control.reportRoute(['root', 'screen-b'], false));
    await elapse(300);
    expect(isShown(success.text)).toBe(true);
  });

  it('carries nothing across any other change of scope', async () => {
    const store = renderToasts();
    act(() => {
      store.dispatch(activateSpace(1));
    });

    // Another switch came first: the one the work makes later is not the expected one.
    const first = control.begin().expectSpaceSwitch();
    act(() => {
      store.dispatch(activateSpace(2));
    });
    act(() => {
      store.dispatch(activateSpace(1));
    });
    act(() => {
      store.dispatch(activateSpace(3));
    });
    expect(first.isCurrent()).toBe(false);

    // The session ended instead.
    const second = control.begin().expectSpaceSwitch();
    act(() => {
      store.dispatch({ type: logoutMe.fulfilled.type });
    });
    expect(second.isCurrent()).toBe(false);

    // The screen was left before the switch.
    act(() => {
      store.dispatch(activateSpace(1));
    });
    const third = control.begin().expectSpaceSwitch();
    act(() => control.reportRoute(['root', 'screen-b'], false));
    act(() => {
      store.dispatch(activateSpace(2));
    });
    expect(third.isCurrent()).toBe(false);

    act(() => third.showAfterNavigation(success));
    act(() => control.reportRoute(['root', 'screen-c'], false));
    await elapse(300);
    expect(isShown(success.text)).toBe(false);
  });
});

describe('placement', () => {
  it('sits above the bottom safe area, the measured tab bar, or the keyboard', async () => {
    renderToasts();
    await show(control.begin(), error);
    expect(placement()).toMatchObject({ bottom: 34 + 12 });

    act(() => {
      control.reportRoute(['root', 'screen-a'], true);
      control.reportTabBarHeight(83);
    });
    expect(placement()).toMatchObject({ bottom: 83 + 12 });

    act(() =>
      keyboardListeners.get('keyboardWillShow')?.({
        endCoordinates: { height: 336, screenY: 516, screenX: 0, width: 393 },
      } as KeyboardEvent),
    );
    expect(placement()).toMatchObject({ bottom: 336 + 12 });
  });

  it('moves to the top while any sheet is on screen, its closing included', async () => {
    renderToasts();
    await show(control.begin(), error);

    act(() => openSheet(confirmation));
    expect(placement()).toMatchObject({ top: 54 + 8 });

    holdDismissals();
    act(() => openSheet(null));
    expect(placement()).toMatchObject({ top: 54 + 8 });

    finishDismissals();
    expect(placement()).toMatchObject({ bottom: 34 + 12 });
  });

  it('shows a sheet’s result only once the sheet has finished closing', async () => {
    renderToasts();
    act(() => openSheet(confirmation));

    holdDismissals();
    act(() => {
      openSheet(null);
      control.begin().showAfterSheetsClose(success);
    });
    await elapse(300);
    expect(isShown(success.text)).toBe(false);

    finishDismissals();
    await elapse(300);
    expect(isShown(success.text)).toBe(true);
    expect(placement()).toMatchObject({ bottom: 34 + 12 });
  });
});
