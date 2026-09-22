import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import {
  selectDataRevision,
  selectIsLoadingLatest,
  selectIsLoadingRange,
  selectLatestError,
  selectLatestTransaction,
  selectPeriodTotals,
  selectRangeError,
  selectRangeTransactions,
} from '@redux/state/transaction/selectors';
import { fetchLatestTransaction, fetchTransactionsInRange } from '@redux/state/transaction/thunks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
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
  const dispatch = useAppDispatch();

  const transactions = useAppSelector(selectRangeTransactions);
  const isLoadingRange = useAppSelector(selectIsLoadingRange);
  const rangeError = useAppSelector(selectRangeError);
  const latest = useAppSelector(selectLatestTransaction);
  const isLoadingLatest = useAppSelector(selectIsLoadingLatest);
  const latestError = useAppSelector(selectLatestError);
  const { income, expense, currencyCode } = useAppSelector(selectPeriodTotals);
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const dataRevision = useAppSelector(selectDataRevision);

  const refetch = () => dispatch(fetchTransactionsInRange({ from: range.from, to: range.to }));
  const retryLatest = () => dispatch(fetchLatestTransaction());

  // Re-fires whenever a transaction is added anywhere in the app
  // (dataRevision), not just when the period or space changes -- otherwise
  // a transaction added from Home wouldn't show up here until something
  // else happened to trigger a refetch.
  useEffect(() => {
    dispatch(fetchTransactionsInRange({ from: range.from, to: range.to }));
  }, [dispatch, range, currentSpaceId, dataRevision]);

  useEffect(() => {
    dispatch(fetchLatestTransaction());
  }, [dispatch, currentSpaceId, dataRevision]);

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
  } else if (latest === undefined) {
    // Settled with no error and no value -- shouldn't happen, but treat as
    // still loading rather than asserting an empty state we can't confirm.
    viewState = 'loading';
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
    refetch,
    retryLatest,
  };
};

export default useTransactionsData;
