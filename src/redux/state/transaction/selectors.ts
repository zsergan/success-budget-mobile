import type { TransactionModel } from '@api/models';
import { isInitialBalance } from '@api/models';
import { getLoadState } from '@redux/api/loadState';
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

// What an empty period says about the whole history: none at all, none in it, or not yet known.
export type EmptyPeriodState = 'loading' | 'latestError' | 'trueEmpty' | 'filteredEmpty';

interface LatestQuery {
  currentData?: TransactionModel | null;
  isUninitialized: boolean;
  isFetching: boolean;
  isError: boolean;
}

export const getEmptyPeriodState = (
  latestQuery: LatestQuery,
  { from, to }: { from: Date; to: Date },
): EmptyPeriodState => {
  const { isLoading, hasError } = getLoadState(latestQuery);
  const latest = latestQuery.currentData;

  if (isLoading || latestQuery.isUninitialized) return 'loading';
  if (hasError) return 'latestError';
  if (latest === null) return 'trueEmpty';

  // A latest record inside the empty period is one just deleted; the next one decides.
  const time = latest ? new Date(latest.timestamp).getTime() : NaN;
  if (time >= from.getTime() && time <= to.getTime()) return latestQuery.isFetching ? 'loading' : 'latestError';

  return 'filteredEmpty';
};
