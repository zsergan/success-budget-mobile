import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { useGetLatestTransactionQuery, useGetTransactionsQuery } from '@redux/state/transaction/api';
import { EMPTY_TRANSACTIONS, getPeriodTotals } from '@redux/state/transaction/selectors';
import type { DateRange } from '@shared/utils';

/**
 * `trueEmpty` (the account has never had a transaction) and `filteredEmpty`
 * (this period has none) need different empty states, which is what `latest`
 * distinguishes: undefined means "not fetched yet", null means "confirmed
 * none". Derived every render, never stored — it is a view of the fetch
 * result, not state of its own.
 *
 * `rangeError`/`latestError` are genuinely different failures: the period
 * itself failed to load (old rows must not linger under it), vs. the period
 * loaded successfully-empty but latest failed, so trueEmpty/filteredEmpty
 * can't be told apart -- neither is a "no operations" result.
 */
export type TransactionsViewState = 'loading' | 'trueEmpty' | 'filteredEmpty' | 'ready' | 'rangeError' | 'latestError';

interface UseTransactionsDataProps {
  range: DateRange;
}

const useTransactionsData = ({ range }: UseTransactionsDataProps) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  // currentData only ever belongs to this exact space and period, so a new
  // period or space shows loading instead of the previous one's rows.
  const rangeQuery = useGetTransactionsQuery(
    spaceId === null ? skipToken : { spaceId, from: range.from.toISOString(), to: range.to.toISOString() },
  );
  const latestQuery = useGetLatestTransactionQuery(useSpaceArg());

  const transactions = rangeQuery.currentData ?? EMPTY_TRANSACTIONS;
  const latest = latestQuery.currentData;
  const { income, expense } = useMemo(() => getPeriodTotals(transactions), [transactions]);

  const isLoadingRange = rangeQuery.currentData === undefined && !rangeQuery.isError;
  const rangeError = rangeQuery.currentData === undefined && rangeQuery.isError;
  const isLoadingLatest = latest === undefined && !latestQuery.isError;
  const latestError = latest === undefined && latestQuery.isError;

  let viewState: TransactionsViewState;

  if (isLoadingRange) {
    viewState = 'loading';
  } else if (rangeError) {
    viewState = 'rangeError';
  } else if (transactions.length > 0) {
    // A non-empty, successfully loaded period is ready regardless of
    // whatever is happening with latest -- that only matters for telling
    // an empty period apart from a genuinely empty account.
    viewState = 'ready';
  } else if (isLoadingLatest) {
    viewState = 'loading';
  } else if (latestError) {
    viewState = 'latestError';
  } else if (latest === null) {
    viewState = 'trueEmpty';
  } else {
    viewState = 'filteredEmpty';
  }

  return {
    transactions,
    viewState,
    latest,
    income,
    expense,
    currencyCode,
    refetch: rangeQuery.refetch,
    retryLatest: latestQuery.refetch,
  };
};

export default useTransactionsData;
