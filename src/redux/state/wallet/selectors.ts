import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@redux/Store';

export const selectWallet = (state: RootState) => state.wallet;

const selectWallets = (state: RootState) => state.wallet.wallets;
const selectRawTotalBalance = (state: RootState) => state.wallet.totalBalance;
const selectTotalBalanceCurrency = (state: RootState) => state.wallet.totalBalanceCurrency;
const selectDeltaPercent = (state: RootState) => state.wallet.deltaPercent;

// total/currencyCode/deltaPercent come straight from the backend; a space
// has exactly one currency, so every wallet in `wallets` already shares it.
export const selectTotalBalance = createSelector(
  selectWallets,
  selectRawTotalBalance,
  selectTotalBalanceCurrency,
  selectDeltaPercent,
  (wallets, total, currencyCode, deltaPercent) => ({
    total,
    currencyCode: currencyCode || undefined,
    walletsCount: wallets.length,
    deltaPercent,
  }),
);
