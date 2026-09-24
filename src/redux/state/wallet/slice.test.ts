import type { GetWalletsResponse } from '@api/dto';
import { AppColor } from '@shared/enums';
import { logoutMe } from '../auth/thunks';
import walletReducer from './slice';
import initialState from './initialState';
import { addWallet, editWallet, fetchWallets, removeWallet } from './thunks';

const wallet: GetWalletsResponse = {
  wallet: {
    id: 1,
    wallet_name: 'Cash',
    balance: 100,
    design: AppColor.SLATE,
  },
  total_spend: 0,
  total_income: 0,
};

const errorResponse = {
  message: 'Ownership check failed',
  statusCode: 403,
  path: '/wallets/1',
  timestamp: '2026-01-01T00:00:00.000Z',
};

describe('wallet slice', () => {
  it('returns the initial state by default', () => {
    expect(walletReducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets isLoading on fetchWallets.pending and clears it on fulfilled', () => {
    const pendingState = walletReducer(initialState, fetchWallets.pending('req-1', undefined));
    expect(pendingState.isLoading).toBe(true);

    const fulfilledState = walletReducer(
      pendingState,
      fetchWallets.fulfilled(
        { total_balance: 100, total_balance_currency: 'USD', delta_percent: 4.2, wallets: [wallet] },
        'req-1',
        undefined,
      ),
    );
    expect(fulfilledState.isLoading).toBe(false);
    expect(fulfilledState.wallets).toEqual([wallet]);
    expect(fulfilledState.totalBalance).toBe(100);
    expect(fulfilledState.totalBalanceCurrency).toBe('USD');
    expect(fulfilledState.deltaPercent).toBe(4.2);
    expect(fulfilledState.hasLoaded).toBe(true);
  });

  it('records the server error on a rejected wallet thunk (fetch, add, edit, or remove)', () => {
    const state = walletReducer(
      initialState,
      addWallet.rejected(new Error('request failed'), 'req-1', {} as never, errorResponse),
    );

    expect(state.error).toEqual(errorResponse);
  });

  it('clears a previous error once a new request starts', () => {
    const withError = { ...initialState, error: errorResponse };

    const state = walletReducer(withError, editWallet.pending('req-2', {} as never));

    expect(state.error).toBeUndefined();
  });

  it('resets to the initial state on logout, even with wallets and an error already loaded', () => {
    const dirtyState = {
      wallets: [wallet],
      totalBalance: 100,
      totalBalanceCurrency: 'USD',
      deltaPercent: 4.2,
      isLoading: false,
      hasLoaded: true,
      error: errorResponse,
    };

    const state = walletReducer(dirtyState, logoutMe.fulfilled(undefined, 'req-3', undefined));

    expect(state).toEqual(initialState);
  });

  it('does not clear existing wallets just because removeWallet is pending', () => {
    // removeWallet has no dedicated case; it relies on its own fetchWallets refetch instead.
    const withWallets = { ...initialState, wallets: [wallet] };

    const state = walletReducer(withWallets, removeWallet.pending('req-4', 1));

    expect(state.wallets).toEqual([wallet]);
  });

  it('an old rejected fetchWallets must not overwrite a newer request in flight', () => {
    const oldPending = walletReducer(initialState, fetchWallets.pending('old', undefined));
    const newPending = walletReducer(oldPending, fetchWallets.pending('new', undefined));

    const afterStaleReject = walletReducer(
      newPending,
      fetchWallets.rejected(new Error('old failed'), 'old', undefined, errorResponse),
    );

    expect(afterStaleReject.isLoading).toBe(true);
    expect(afterStaleReject.error).toBeUndefined();
  });
});
