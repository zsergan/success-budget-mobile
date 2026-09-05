import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@redux/Store';

export const selectWallet = (state: RootState) => state.wallet;

const selectWallets = (state: RootState) => state.wallet.wallets;
const selectBaseCurrency = (state: RootState) => state.profile.baseCurrency;

// Sums only base-currency wallets — no exchange-rate data exists, so mixing currencies would be meaningless.
export const selectTotalBalance = createSelector(selectWallets, selectBaseCurrency, (wallets, baseCurrency) => {
  if (!baseCurrency) {
    return { total: 0, currencyCode: undefined, walletsCount: 0 };
  }

  const baseCurrencyWallets = wallets.filter((w) => w.wallet.currency.id === baseCurrency.id);
  const total = baseCurrencyWallets.reduce((sum, w) => sum + Number(w.wallet.balance), 0);

  return { total, currencyCode: baseCurrency.code, walletsCount: baseCurrencyWallets.length };
});
