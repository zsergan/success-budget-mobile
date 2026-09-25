import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { periodArg, useGetLatestTransactionQuery, useGetTransactionsQuery } from '@redux/state/transaction/api';
import { EMPTY_TRANSACTIONS, getPeriodTotals } from '@redux/state/transaction/selectors';
import type { DateRange } from '@shared/utils';

// trueEmpty: no transactions at all; filteredEmpty: none in this period.
// latestError: the period is empty but whether any transactions exist couldn't be checked.
export type TransactionsViewState = 'loading' | 'trueEmpty' | 'filteredEmpty' | 'ready' | 'rangeError' | 'latestError';

interface UseTransactionsDataProps {
  range: DateRange;
}

const useTransactionsData = ({ range }: UseTransactionsDataProps) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  // currentData only ever belongs to this exact space and period, so a new
  // period or space shows loading instead of the previous one's rows.
  const rangeQuery = useGetTransactionsQuery(spaceId === null ? skipToken : periodArg(spaceId, range));
  const latestQuery = useGetLatestTransactionQuery(useSpaceArg());

  const transactions = rangeQuery.currentData ?? EMPTY_TRANSACTIONS;
  const latest = latestQuery.currentData;
  const { income, expense } = useMemo(() => getPeriodTotals(transactions), [transactions]);

  const { isLoading: isLoadingRange, hasError: rangeError } = getLoadState(rangeQuery);
  const { isLoading: isLoadingLatest, hasError: latestError } = getLoadState(latestQuery);

  let viewState: TransactionsViewState;

  if (isLoadingRange) {
    viewState = 'loading';
  } else if (rangeError) {
    viewState = 'rangeError';
  } else if (transactions.length > 0) {
    // latest only matters for telling an empty period from an empty account.
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
