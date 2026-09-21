import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import {
  selectDataRevision,
  selectIsLoadingRange,
  selectLatestTransaction,
  selectPeriodTotals,
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
 */
export type TransactionsViewState = 'loading' | 'trueEmpty' | 'filteredEmpty' | 'ready';

interface UseTransactionsDataProps {
  range: DateRange;
}

const useTransactionsData = ({ range }: UseTransactionsDataProps) => {
  const dispatch = useAppDispatch();

  const transactions = useAppSelector(selectRangeTransactions);
  const isLoadingRange = useAppSelector(selectIsLoadingRange);
  const latest = useAppSelector(selectLatestTransaction);
  const { income, expense, currencyCode } = useAppSelector(selectPeriodTotals);
  const currentSpaceId = useAppSelector(selectCurrentSpaceId);
  const dataRevision = useAppSelector(selectDataRevision);

  const refetch = () => dispatch(fetchTransactionsInRange({ from: range.from, to: range.to }));

  // Re-fires whenever a transaction is added anywhere in the app
  // (dataRevision), not just when the period or space changes -- otherwise
  // a transaction added from Home wouldn't show up here until something
  // else happened to trigger a refetch.
  useEffect(() => {
    dispatch(fetchTransactionsInRange({ from: range.from, to: range.to }));
  }, [dispatch, range, currentSpaceId, dataRevision]);

  useEffect(() => {
    dispatch(fetchLatestTransaction());
  }, [dispatch, currentSpaceId]);

  const viewState: TransactionsViewState =
    isLoadingRange || (transactions.length === 0 && latest === undefined)
      ? 'loading'
      : latest === null
        ? 'trueEmpty'
        : transactions.length === 0
          ? 'filteredEmpty'
          : 'ready';

  return {
    transactions,
    viewState,
    latest,
    income,
    expense,
    currencyCode,
    refetch,
  };
};

export default useTransactionsData;
