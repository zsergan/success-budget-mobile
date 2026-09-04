import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@redux/Store';
import { TransactionType } from '@shared/enums';

export const selectTransaction = (state: RootState) => state.transaction;

export const selectRangeTransactions = (state: RootState) => state.transaction.rangeTransactions;
export const selectIsLoadingRange = (state: RootState) => state.transaction.isLoadingRange;
export const selectLatestTransaction = (state: RootState) => state.transaction.latest;

const selectBaseCurrency = (state: RootState) => state.profile.baseCurrency;

/**
 * Income/expense totals for the currently loaded (from/to-scoped) range —
 * base-currency-only, same convention as `groupTransactionsByDay`'s
 * per-day totals: no exchange-rate data exists anywhere in the app, so
 * summing across currencies would produce a meaningless number.
 */
export const selectPeriodTotals = createSelector(
  selectRangeTransactions,
  selectBaseCurrency,
  (transactions, baseCurrency) => {
    if (!baseCurrency) {
      return { income: 0, expense: 0, currencyCode: undefined };
    }

    const relevant = transactions.filter((t) => t.currency.code === baseCurrency.code);
    const income = relevant
      .filter((t) => t.transactionType === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = relevant
      .filter((t) => t.transactionType === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expense, currencyCode: baseCurrency.code };
  },
);
