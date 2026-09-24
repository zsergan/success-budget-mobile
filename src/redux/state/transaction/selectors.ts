import type { TransactionModel } from '@api/models';
import { TransactionType } from '@shared/enums';

export const EMPTY_TRANSACTIONS: TransactionModel[] = [];

// A space has exactly one currency, so every transaction in it is already in
// that currency — no cross-currency filtering needed.
export const getPeriodTotals = (transactions: TransactionModel[]) => ({
  income: transactions
    .filter((transaction) => transaction.transactionType === TransactionType.INCOME)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
  expense: transactions
    .filter((transaction) => transaction.transactionType === TransactionType.EXPENSE)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
});
