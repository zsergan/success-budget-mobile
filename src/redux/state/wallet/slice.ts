import { createSlice, isPending, isRejected } from '@reduxjs/toolkit';

import { logoutMe } from '../auth/thunks';
import initialState from './initialState';
import { addWallet, editWallet, fetchWallets, removeWallet } from './thunks';

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(logoutMe.fulfilled, () => initialState);

    builder.addCase(fetchWallets.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(fetchWallets.rejected, (state) => {
      state.isLoading = false;
    });

    builder.addCase(fetchWallets.fulfilled, (state, action) => {
      state.wallets = action.payload.wallets;
      state.totalBalance = action.payload.total_balance;
      state.totalBalanceCurrency = action.payload.total_balance_currency;
      state.deltaPercent = action.payload.delta_percent;
      state.isLoading = false;
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
