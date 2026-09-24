import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { loginMe, logoutMe } from '@redux/state/auth/thunks';
import { activateSpace } from '@redux/state/space/thunks';
import useConfirmAction from './useConfirmAction';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn() }),
}));
jest.mock('expo-secure-store');

interface Item {
  id: number;
}

const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const action = jest.fn((_target: Item, _spaceId: number) => ({ unwrap: () => promise }));

  return { action, resolve, reject };
};

const renderConfirmAction = () => {
  const store = createAppStore();

  store.dispatch(activateSpace(1));

  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useConfirmAction<Item>(), { wrapper: Wrapper });

  return { store, result };
};

const startConfirm = (result: { current: ReturnType<typeof useConfirmAction<Item>> }, action: jest.Mock) => {
  let running!: Promise<void>;

  act(() => {
    running = result.current.confirm(action);
  });

  return running;
};

it('stays open and locked until the action succeeds, then closes', async () => {
  const { action, resolve } = deferred();
  const { result } = renderConfirmAction();

  act(() => result.current.open({ id: 7 }));

  const running = startConfirm(result, action);

  expect(action).toHaveBeenCalledWith({ id: 7 }, 1);
  expect(result.current.isPending).toBe(true);

  act(() => result.current.cancel());

  expect(result.current.target).toEqual({ id: 7 });

  await act(async () => {
    resolve();
    await running;
  });

  expect(result.current.target).toBeNull();
  expect(result.current.isPending).toBe(false);
});

it('keeps the dialog open with the error, clears it on retry and on reopening', async () => {
  const failing = deferred();
  const { result } = renderConfirmAction();

  act(() => result.current.open({ id: 7 }));

  await act(async () => {
    const running = result.current.confirm(failing.action);

    failing.reject({ message: 'Wallet has transactions', statusCode: 409 });
    await running;
  });

  expect(result.current.target).toEqual({ id: 7 });
  expect(result.current.isPending).toBe(false);
  expect(result.current.error).toBe('Wallet has transactions');

  const retry = deferred();
  const running = startConfirm(result, retry.action);

  expect(result.current.error).toBeNull();

  await act(async () => {
    retry.reject({ message: 'Still failing', statusCode: 409 });
    await running;
  });

  act(() => result.current.cancel());
  act(() => result.current.open({ id: 7 }));

  expect(result.current.error).toBeNull();
});

it('ignores a second confirm while the first is in flight', async () => {
  const { action, resolve } = deferred();
  const { result } = renderConfirmAction();

  act(() => result.current.open({ id: 7 }));

  await act(async () => {
    const first = result.current.confirm(action);
    const second = result.current.confirm(action);

    resolve();
    await Promise.all([first, second]);
  });

  expect(action).toHaveBeenCalledTimes(1);
});

describe('a space switch during the request', () => {
  it('drops the dialog and does not bring it back when switching back', () => {
    const { action } = deferred();
    const { store, result } = renderConfirmAction();

    act(() => result.current.open({ id: 7 }));
    startConfirm(result, action);

    act(() => store.dispatch(activateSpace(2)));

    expect(result.current.target).toBeNull();
    expect(result.current.isPending).toBe(false);

    act(() => store.dispatch(activateSpace(1)));

    expect(result.current.target).toBeNull();
  });

  const outcomes = [
    ['succeeds', (old: ReturnType<typeof deferred>) => old.resolve()],
    ['fails', (old: ReturnType<typeof deferred>) => old.reject({ message: 'Server error', statusCode: 500 })],
  ] as const;
  const cases = [2, 1].flatMap((nextSpaceId) =>
    outcomes.map(([outcome, settle]) => [nextSpaceId, outcome, settle] as const),
  );

  it.each(cases)(
    'leaves the next dialog in space %s alone when the old request %s',
    async (nextSpaceId, _outcome, settle) => {
      const old = deferred();
      const next = deferred();
      const { store, result } = renderConfirmAction();

      act(() => result.current.open({ id: 7 }));

      const oldRunning = startConfirm(result, old.action);

      act(() => store.dispatch(activateSpace(2)));
      act(() => store.dispatch(activateSpace(nextSpaceId)));
      act(() => result.current.open({ id: 8 }));
      startConfirm(result, next.action);

      expect(next.action).toHaveBeenCalledWith({ id: 8 }, nextSpaceId);

      await act(async () => {
        settle(old);
        await oldRunning;
      });

      expect(result.current.target).toEqual({ id: 8 });
      expect(result.current.isPending).toBe(true);
      expect(result.current.error).toBeNull();
    },
  );
});

it('does not send the request once the store has moved to another space, even before a render', () => {
  const { action } = deferred();
  const { store, result } = renderConfirmAction();

  act(() => result.current.open({ id: 7 }));

  const { confirm } = result.current;

  store.dispatch(activateSpace(2));
  act(() => {
    confirm(action);
  });

  expect(action).not.toHaveBeenCalled();
});

it.each([
  ['succeeds', (old: ReturnType<typeof deferred>) => old.resolve()],
  ['fails', (old: ReturnType<typeof deferred>) => old.reject({ message: 'Server error', statusCode: 500 })],
])('clears a locked dialog on logout and ignores the request when it %s', async (_outcome, settle) => {
  const pending = deferred();
  const { store, result } = renderConfirmAction();

  act(() => result.current.open({ id: 7 }));

  const running = startConfirm(result, pending.action);

  await act(async () => {
    await store.dispatch(logoutMe());
  });

  expect(result.current.target).toBeNull();
  expect(result.current.isPending).toBe(false);

  await act(async () => {
    store.dispatch(loginMe.fulfilled('token-2', 'req-login-2', { email: 'a@b.com', password: 'password1' }));
    store.dispatch(activateSpace(1));
    settle(pending);
    await running;
  });

  expect(result.current.target).toBeNull();
  expect(result.current.error).toBeNull();
});

it('does not open without an active space', () => {
  const { store, result } = renderConfirmAction();

  act(() => store.dispatch(activateSpace(null)));
  act(() => result.current.open({ id: 7 }));

  expect(result.current.target).toBeNull();
});
