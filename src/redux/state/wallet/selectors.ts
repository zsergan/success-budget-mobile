import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@redux/Store';

export const selectWallet = (state: RootState) => state.wallet;

const selectWallets = (state: RootState) => state.wallet.wallets;
const selectRawTotalBalance = (state: RootState) => state.wallet.totalBalance;
const selectTotalBalanceCurrency = (state: RootState) => state.wallet.totalBalanceCurrency;
const selectDeltaPercent = (state: RootState) => state.wallet.deltaPercent;

// total/currencyCode/deltaPercent now come straight from the backend (it already
// excludes non-base-currency wallets — see mobile-api-changes.md); walletsCount
// keeps its prior meaning by counting wallets in that same currency.
export const selectTotalBalance = createSelector(
  selectWallets,
  selectRawTotalBalance,
  selectTotalBalanceCurrency,
  selectDeltaPercent,
  (wallets, total, currencyCode, deltaPercent) => ({
    total,
    currencyCode: currencyCode || undefined,
    walletsCount: wallets.filter((w) => w.wallet.currency.code === currencyCode).length,
    deltaPercent,
  }),
);
