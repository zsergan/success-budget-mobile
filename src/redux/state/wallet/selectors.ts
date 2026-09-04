import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@redux/Store';

export const selectWallet = (state: RootState) => state.wallet;

const selectWallets = (state: RootState) => state.wallet.wallets;
const selectBaseCurrency = (state: RootState) => state.profile.baseCurrency;

/**
 * Hero total balance on Home (design stage 7) — sums only wallets whose
 * currency matches the user's base currency. Wallets can each have their
 * own currency (see CreateWalletScreen), and there's no exchange-rate
 * data anywhere in this app, so summing raw balances across different
 * currencies would produce a meaningless number; excluding the rest is
 * the only option that isn't silently wrong. Excluded wallets still show
 * up in the carousel below, just don't count toward this total.
 */
export const selectTotalBalance = createSelector(selectWallets, selectBaseCurrency, (wallets, baseCurrency) => {
  if (!baseCurrency) {
    return { total: 0, currencyCode: undefined, walletsCount: 0 };
  }

  const baseCurrencyWallets = wallets.filter((w) => w.wallet.currency.id === baseCurrency.id);
  const total = baseCurrencyWallets.reduce((sum, w) => sum + Number(w.wallet.balance), 0);

  return { total, currencyCode: baseCurrency.code, walletsCount: baseCurrencyWallets.length };
});
