import type { GetWalletsResponse } from '@api/dto';
import { WalletDesign } from '@shared/enums';
import { logoutMe } from '../auth/thunks';
import walletReducer from './slice';
import initialState from './initialState';
import { addWallet, editWallet, fetchWallets, removeWallet } from './thunks';

const wallet: GetWalletsResponse = {
  wallet: {
    id: 1,
    wallet_name: 'Cash',
    balance: '100',
    currency: { id: 1, code: 'USD', name: 'Dollar' },
    design: WalletDesign.SLATE,
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

    const fulfilledState = walletReducer(pendingState, fetchWallets.fulfilled([wallet], 'req-1', undefined));
    expect(fulfilledState.isLoading).toBe(false);
    expect(fulfilledState.wallets).toEqual([wallet]);
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
    const dirtyState = { wallets: [wallet], isLoading: false, error: errorResponse };

    const state = walletReducer(dirtyState, logoutMe.fulfilled(undefined, 'req-3', undefined));

    expect(state).toEqual(initialState);
  });

  it('does not clear existing wallets just because removeWallet is pending', () => {
    // removeWallet has no dedicated case; it relies on its own fetchWallets refetch instead.
    const withWallets = { ...initialState, wallets: [wallet] };

    const state = walletReducer(withWallets, removeWallet.pending('req-4', 1));

    expect(state.wallets).toEqual([wallet]);
  });
});
