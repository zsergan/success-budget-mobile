import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react-native';

import { createToastRecorder } from '@components/Toast/testing';
import { createAppStore } from '@redux/Store';
import { activateSpace } from '@redux/state/space/thunks';
import { walletApi } from '@redux/state/wallet/api';
import { AppColor } from '@shared/enums';
import useAddTransaction from './useAddTransaction';

const mockedRequest = jest.fn();

jest.mock('@api/instance', () => ({
  ApiClient: () => ({}),
  createHttpClient: () => ({ request: (...args: unknown[]) => mockedRequest(...args) }),
}));
jest.mock('expo-secure-store');

const mockToasts = createToastRecorder();
jest.mock('@hooks', () => ({ useToast: () => mockToasts.toast }));

// RTK Query schedules cache removal and batched notifications on timers that would otherwise outlive the test.
jest.useFakeTimers();

const overview = (walletIds: number[]) => ({
  data: {
    total_balance: 0,
    total_balance_currency: 'USD',
    delta_percent: 0,
    wallets: walletIds.map((id) => ({
      wallet: { id, wallet_name: `Wallet ${id}`, design: AppColor.SLATE, balance: 0 },
      total_spend: 0,
      total_income: 0,
    })),
  },
});

const deferred = () => {
  let resolve: (value: unknown) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const renderAddTransaction = () => {
  const store = createAppStore();
  const onHasWallets = jest.fn();
  const onNoWallets = jest.fn();

  store.dispatch(activateSpace(1));

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  const { result } = renderHook(() => useAddTransaction({ onHasWallets, onNoWallets }), { wrapper });

  return { store, result, onHasWallets, onNoWallets };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockToasts.clear();
});

describe('useAddTransaction', () => {
  it('waits for wallets still loading, then asks for a wallet when there are none', async () => {
    const request = deferred();
    mockedRequest.mockReturnValue(request.promise);
    const { store, result, onHasWallets, onNoWallets } = renderAddTransaction();
    const screenQuery = store.dispatch(walletApi.endpoints.getWallets.initiate({ spaceId: 1 }));

    let pressed: Promise<void> = Promise.resolve();
    act(() => {
      pressed = result.current();
    });
    expect(onNoWallets).not.toHaveBeenCalled();
    expect(mockedRequest).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve(overview([]));
      await pressed;
    });

    expect(onNoWallets).toHaveBeenCalledTimes(1);
    expect(onHasWallets).not.toHaveBeenCalled();
    expect(mockToasts.shown).toEqual([]);
    screenQuery.unsubscribe();
  });

  it('opens the composer when the space has a wallet', async () => {
    mockedRequest.mockResolvedValue(overview([4]));
    const { result, onHasWallets, onNoWallets } = renderAddTransaction();

    await act(() => result.current());

    expect(onHasWallets).toHaveBeenCalledTimes(1);
    expect(onNoWallets).not.toHaveBeenCalled();
  });

  it('reports a failed request instead of treating it as no wallets, and its Retry checks again', async () => {
    mockedRequest.mockRejectedValue({ response: { status: 500, data: { statusCode: 500, message: 'boom' } } });
    const { result, onHasWallets, onNoWallets } = renderAddTransaction();

    await act(() => result.current());

    expect(onNoWallets).not.toHaveBeenCalled();
    expect(onHasWallets).not.toHaveBeenCalled();
    expect(mockToasts.shown).toEqual([
      {
        message: expect.objectContaining({
          tone: 'error',
          text: 'Couldn’t load your wallets. Check your connection and try again.',
          action: expect.objectContaining({ label: 'Retry' }),
        }),
        when: 'now',
      },
    ]);

    mockedRequest.mockResolvedValue(overview([]));
    await act(async () => {
      mockToasts.shown[0].message.action?.onPress();
      await jest.advanceTimersByTimeAsync(0);
    });

    expect(onNoWallets).toHaveBeenCalledTimes(1);
    expect(mockToasts.shown).toHaveLength(1);
  });

  it('does nothing when the space changed while the wallets loaded', async () => {
    const request = deferred();
    mockedRequest.mockReturnValue(request.promise);
    const { store, result, onHasWallets, onNoWallets } = renderAddTransaction();

    let pressed: Promise<void> = Promise.resolve();
    act(() => {
      pressed = result.current();
    });
    store.dispatch(activateSpace(2));

    await act(async () => {
      request.resolve(overview([]));
      await pressed;
    });

    expect(onNoWallets).not.toHaveBeenCalled();
    expect(onHasWallets).not.toHaveBeenCalled();
    expect(mockToasts.shown).toEqual([]);
  });
});
