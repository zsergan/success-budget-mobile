import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createAppStore } from '@redux/Store';
import { logoutMe } from '@redux/state/auth/thunks';
import useConfirmAction from './useConfirmAction';

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: jest.fn() }),
}));
jest.mock('expo-secure-store');

const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { action: jest.fn(() => ({ unwrap: () => promise })), resolve, reject };
};

const renderConfirmAction = () => {
  const store = createAppStore();
  const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useConfirmAction(), { wrapper: Wrapper });

  return { store, result };
};

it('stays pending until the action settles and then calls onSuccess', async () => {
  const { action, resolve } = deferred();
  const onSuccess = jest.fn();
  const { result } = renderConfirmAction();

  let running!: Promise<void>;

  act(() => {
    running = result.current.run(action, onSuccess);
  });

  expect(result.current.isPending).toBe(true);
  expect(onSuccess).not.toHaveBeenCalled();

  await act(async () => {
    resolve();
    await running;
  });

  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(result.current.isPending).toBe(false);
  expect(result.current.error).toBeNull();
});

it('keeps the error instead of calling onSuccess and allows a retry', async () => {
  const failing = deferred();
  const onSuccess = jest.fn();
  const { result } = renderConfirmAction();

  await act(async () => {
    const running = result.current.run(failing.action, onSuccess);

    failing.reject({ message: 'Wallet has transactions', statusCode: 409 });
    await running;
  });

  expect(onSuccess).not.toHaveBeenCalled();
  expect(result.current.isPending).toBe(false);
  expect(result.current.error).toBe('Wallet has transactions');

  const retry = deferred();
  let running!: Promise<void>;

  act(() => {
    running = result.current.run(retry.action, onSuccess);
  });

  expect(result.current.error).toBeNull();

  await act(async () => {
    retry.resolve();
    await running;
  });

  expect(onSuccess).toHaveBeenCalledTimes(1);
});

it('ignores a second run while the first is still in flight', async () => {
  const { action, resolve } = deferred();
  const onSuccess = jest.fn();
  const { result } = renderConfirmAction();

  await act(async () => {
    const first = result.current.run(action, onSuccess);
    const second = result.current.run(action, onSuccess);

    resolve();
    await Promise.all([first, second]);
  });

  expect(action).toHaveBeenCalledTimes(1);
  expect(onSuccess).toHaveBeenCalledTimes(1);
});

it('turns a synchronous throw into an error', async () => {
  const { result } = renderConfirmAction();

  await act(() =>
    result.current.run(() => {
      throw { message: 'No active space' };
    }, jest.fn()),
  );

  expect(result.current.error).toBe('No active space');
  expect(result.current.isPending).toBe(false);
});

it('clears the error on resetError', async () => {
  const { action, reject } = deferred();
  const { result } = renderConfirmAction();

  await act(async () => {
    const running = result.current.run(action, jest.fn());

    reject({ message: 'Not found', statusCode: 404 });
    await running;
  });

  act(() => result.current.resetError());

  expect(result.current.error).toBeNull();
});

it.each([
  ['succeeds', (settle: ReturnType<typeof deferred>) => settle.resolve()],
  ['fails', (settle: ReturnType<typeof deferred>) => settle.reject({ message: 'Server error', statusCode: 500 })],
])('stays silent when the action %s after a logout', async (_outcome, settle) => {
  const pending = deferred();
  const onSuccess = jest.fn();
  const { store, result } = renderConfirmAction();

  await act(async () => {
    const running = result.current.run(pending.action, onSuccess);

    await store.dispatch(logoutMe());
    settle(pending);
    await running;
  });

  expect(onSuccess).not.toHaveBeenCalled();
  expect(result.current.error).toBeNull();
  expect(result.current.isPending).toBe(false);
});
