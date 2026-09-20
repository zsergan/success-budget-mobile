import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@redux/Store';
import { selectCurrentSpaceCurrencyCode } from '@redux/state/space/selectors';
import { TransactionType } from '@shared/enums';

export const selectTransaction = (state: RootState) => state.transaction;

export const selectRangeTransactions = (state: RootState) => state.transaction.rangeTransactions;
export const selectIsLoadingRange = (state: RootState) => state.transaction.isLoadingRange;
export const selectLatestTransaction = (state: RootState) => state.transaction.latest;

// A space has exactly one currency, so every transaction in it is already in
// that currency — no cross-currency filtering needed.
export const selectPeriodTotals = createSelector(
  selectRangeTransactions,
  selectCurrentSpaceCurrencyCode,
  (transactions, currencyCode) => {
    if (!currencyCode) {
      return { income: 0, expense: 0, currencyCode: undefined };
    }

    const income = transactions
      .filter((t) => t.transactionType === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions
      .filter((t) => t.transactionType === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expense, currencyCode };
  },
);
