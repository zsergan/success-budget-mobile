import type { ReactNode } from 'react';
import { Keyboard } from 'react-native';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import type { Confirmation } from '@components/ConfirmationSheet/ConfirmationSheet';
import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import useConfirmation from './useConfirmation';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn() }),
}));
jest.mock('expo-secure-store');

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const setUp = () => {
  const store = createAppStore();
  store.dispatch(activateSpace(1));
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const hook = renderHook(() => useConfirmation(), { wrapper });

  // Asks a question whose action runs `onConfirm` only while it still applies, as every owner's does.
  const ask = (title = 'Delete wallet?') => {
    const onConfirm = jest.fn();
    let settle: () => boolean = () => false;
    let isAsked = false;
    act(() => {
      isAsked = hook.result.current.lock.ask((given): Confirmation => {
        settle = given;
        return {
          title,
          description: 'Its transactions stay.',
          primaryAction: {
            label: 'Delete',
            onPress: () => {
              if (settle()) onConfirm();
            },
          },
          onCancel: settle,
        };
      });
    });
    const confirmation = hook.result.current.confirmation;
    const confirm = () => act(() => void confirmation?.primaryAction.onPress());
    return { isAsked, confirmation, onConfirm, confirm, settle: () => settle() };
  };

  const switchTo = (...spaceIds: number[]) =>
    act(() => {
      spaceIds.forEach((spaceId) => store.dispatch(activateSpace(spaceId)));
    });

  return { ...hook, store, ask, switchTo };
};

const holdKeyboard = () => {
  const hide = { current: () => {} };
  const remove = jest.fn();
  jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
  jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  jest.spyOn(Keyboard, 'addListener').mockImplementation((event, listener) => {
    if (event === 'keyboardDidHide') hide.current = () => listener({} as never);
    return { remove } as never;
  });
  return { hide: () => act(() => hide.current()), remove };
};

it('asks, runs the chosen action once it closes, and is free again', () => {
  const { result, ask } = setUp();

  const first = ask();
  expect(first.isAsked).toBe(true);
  expect(result.current.confirmation).toMatchObject({ title: 'Delete wallet?' });
  expect(result.current.lock.isLocked()).toBe(true);

  first.confirm();
  expect(first.onConfirm).toHaveBeenCalledTimes(1);
  expect(result.current.confirmation).toBeNull();
  expect(result.current.lock.isLocked()).toBe(false);

  expect(ask().isAsked).toBe(true);
});

it('closes on cancel, after which the cancelled question no longer applies', () => {
  const { result, ask } = setUp();
  const first = ask();

  act(() => void first.confirmation?.onCancel());
  expect(result.current.confirmation).toBeNull();

  first.confirm();
  expect(first.onConfirm).not.toHaveBeenCalled();
});

it('asks one question at a time', () => {
  const { result, ask } = setUp();
  const first = ask();

  const second = ask('Delete limit?');
  expect(second.isAsked).toBe(false);
  expect(result.current.confirmation).toBe(first.confirmation);

  first.confirm();
  expect(first.onConfirm).toHaveBeenCalledTimes(1);
});

it.each([
  ['across renders', (switchTo: (...ids: number[]) => void) => (switchTo(2), switchTo(1))],
  ['within one update', (switchTo: (...ids: number[]) => void) => switchTo(2, 1)],
])('does not bring a question back when its space returns %s', (_when, roundTrip) => {
  const { result, ask, switchTo } = setUp();
  const first = ask();

  roundTrip(switchTo);

  expect(result.current.confirmation).toBeNull();
  expect(result.current.lock.isLocked()).toBe(false);
  expect(first.settle()).toBe(false);
  first.confirm();
  expect(first.onConfirm).not.toHaveBeenCalled();
  expect(ask().isAsked).toBe(true);
});

it('drops a question before the next render, so the next one can open at once', () => {
  const { result, store, ask } = setUp();
  ask();

  let isLocked = true;
  act(() => {
    store.dispatch(activateSpace(2));
    isLocked = result.current.lock.isLocked();
  });

  expect(isLocked).toBe(false);
});

it('leaves a newer question alone when an older one is answered', () => {
  const { result, ask, switchTo } = setUp();
  const first = ask();
  switchTo(2);
  const second = ask('Delete limit?');

  expect(first.settle()).toBe(false);
  first.confirm();

  expect(first.onConfirm).not.toHaveBeenCalled();
  expect(result.current.confirmation).toBe(second.confirmation);
  expect(result.current.lock.isLocked()).toBe(true);
  second.confirm();
  expect(second.onConfirm).toHaveBeenCalledTimes(1);
});

it('waits for the keyboard to go before showing a question', () => {
  const keyboard = holdKeyboard();
  const { result, ask } = setUp();

  ask();
  expect(result.current.confirmation).toBeNull();
  expect(result.current.lock.isLocked()).toBe(true);

  keyboard.hide();
  expect(result.current.confirmation).toMatchObject({ title: 'Delete wallet?' });
});

it('shows nothing when the space changes while the keyboard goes', () => {
  const keyboard = holdKeyboard();
  const { result, ask, switchTo } = setUp();
  ask();

  switchTo(2, 1);
  expect(keyboard.remove).toHaveBeenCalled();
  keyboard.hide();

  expect(result.current.confirmation).toBeNull();
  expect(result.current.lock.isLocked()).toBe(false);
});

it('shows nothing when the keyboard wait runs out after the space changed', () => {
  jest.useFakeTimers();
  holdKeyboard();
  const { result, ask, switchTo } = setUp();
  ask();

  switchTo(2);
  switchTo(1);
  act(() => jest.runAllTimers());

  expect(result.current.confirmation).toBeNull();
});

it('drops a question on logout, and a new session in the same space does not revive it', async () => {
  const { result, store, ask } = setUp();
  const first = ask();

  await act(async () => {
    await store.dispatch(logoutMe());
  });
  expect(result.current.confirmation).toBeNull();

  act(() => {
    store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
    store.dispatch(activateSpace(1));
  });
  first.confirm();

  expect(first.onConfirm).not.toHaveBeenCalled();
  expect(result.current.confirmation).toBeNull();
});

it('does not ask without an active space, and drops a question once there is none', () => {
  const { result, ask, store } = setUp();
  const first = ask();

  act(() => {
    store.dispatch(activateSpace(null));
  });
  expect(result.current.confirmation).toBeNull();
  expect(ask().isAsked).toBe(false);

  act(() => {
    store.dispatch(activateSpace(1));
  });
  first.confirm();
  expect(first.onConfirm).not.toHaveBeenCalled();
});

it('stops waiting and drops the question when its owner unmounts', () => {
  const keyboard = holdKeyboard();
  const { ask, unmount } = setUp();
  const first = ask();

  unmount();

  expect(keyboard.remove).toHaveBeenCalled();
  expect(first.settle()).toBe(false);
});
