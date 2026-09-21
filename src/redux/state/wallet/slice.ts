import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import { spaceContextChanged } from '../space/thunks';
import initialState from './initialState';
import { addWallet, editWallet, fetchWallets, removeWallet } from './thunks';

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    // Drop the previous space's wallets immediately -- before its own
    // fetchWallets has even been dispatched -- and forget any in-flight
    // request for it (clearing requestId means a late response can no
    // longer match). `hasLoaded` survives so useLoadInitData doesn't treat
    // a space switch as the app's very first load.
    builder.addCase(spaceContextChanged, (state) => ({ ...initialState, hasLoaded: state.hasLoaded, isLoading: true }));

    builder.addCase(fetchWallets.pending, (state, action) => {
      state.isLoading = true;
      state.requestId = action.meta.requestId;
    });

    builder.addCase(fetchWallets.rejected, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.isLoading = false;
    });

    builder.addCase(fetchWallets.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.requestId) return;

      state.wallets = action.payload.wallets;
      state.totalBalance = action.payload.total_balance;
      state.totalBalanceCurrency = action.payload.total_balance_currency;
      state.deltaPercent = action.payload.delta_percent;
      state.isLoading = false;
      state.hasLoaded = true;
    });

    builder.addMatcher(isPending(fetchWallets, addWallet, editWallet, removeWallet), (state) => {
      state.error = undefined;
    });

    builder.addMatcher(isRejected(fetchWallets, addWallet, editWallet, removeWallet), (state, action) => {
      state.error = action.payload;
    });
  },
});

export default walletSlice.reducer;
