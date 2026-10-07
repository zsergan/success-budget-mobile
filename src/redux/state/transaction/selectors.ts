import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import { TransactionType } from '@shared/enums';
import { toCents } from '@shared/utils';

export const EMPTY_TRANSACTIONS: TransactionModel[] = [];

const sumOf = (transactions: TransactionModel[], type: TransactionType) =>
  transactions
    .filter((transaction) => transaction.transactionType === type && !isInitialBalance(transaction))
    .reduce((sum, transaction) => sum + toCents(transaction.amount), 0) / 100;

// A space has exactly one currency, so every transaction in it is already in
// that currency — no cross-currency filtering needed.
export const getPeriodTotals = (transactions: TransactionModel[]) => ({
  income: sumOf(transactions, TransactionType.INCOME),
  expense: sumOf(transactions, TransactionType.EXPENSE),
});
