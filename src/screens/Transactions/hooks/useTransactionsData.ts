import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { getLoadState } from '@redux/api/loadState';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { periodArg, useGetLatestTransactionQuery, useGetTransactionsQuery } from '@redux/state/transaction/api';
import { EMPTY_TRANSACTIONS, getEmptyPeriodState, getPeriodTotals } from '@redux/state/transaction/selectors';
import type { TransactionsArg } from '@redux/state/transaction/api';
import type { HistoryFilter } from '@shared/types';
import type { DateRange } from '@shared/utils';

// trueEmpty: no transactions at all; filteredEmpty: none in this period; noMatches: none under a Stats filter.
// latestError: the period is empty but whether any transactions exist couldn't be checked.
export type TransactionsViewState =
  'loading' | 'trueEmpty' | 'filteredEmpty' | 'noMatches' | 'ready' | 'rangeError' | 'latestError';

interface UseTransactionsDataProps {
  range: DateRange;
  // Replaces the period: its bounds go to the API exactly as Stats got them.
  filter: HistoryFilter | null;
}

const toFilterArg = ({ spaceId, from, to, transactionType, categoryId, walletId }: HistoryFilter): TransactionsArg => ({
  spaceId,
  from,
  to,
  transactionType,
  ...(categoryId !== undefined ? { categoryId } : { walletId }),
});

const useTransactionsData = ({ range, filter }: UseTransactionsDataProps) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  // currentData only ever belongs to this exact space and period, so a new
  // period or space shows loading instead of the previous one's rows.
  const rangeQuery = useGetTransactionsQuery(
    spaceId === null ? skipToken : filter ? toFilterArg(filter) : periodArg(spaceId, range),
  );
  // Whether the account has any history at all only matters for an empty period.
  const spaceArg = useSpaceArg();
  const latestQuery = useGetLatestTransactionQuery(filter ? skipToken : spaceArg);

  const transactions = rangeQuery.currentData ?? EMPTY_TRANSACTIONS;
  const latest = latestQuery.currentData;
  const { income, expense } = useMemo(() => getPeriodTotals(transactions), [transactions]);

  const { isLoading: isLoadingRange, hasError: rangeError, hasRefreshError } = getLoadState(rangeQuery);

  let viewState: TransactionsViewState;

  if (isLoadingRange) {
    viewState = 'loading';
  } else if (rangeError) {
    viewState = 'rangeError';
  } else if (transactions.length > 0) {
    // latest only matters for telling an empty period from an empty account.
    viewState = 'ready';
  } else if (filter) {
    viewState = 'noMatches';
  } else {
    viewState = getEmptyPeriodState(latestQuery, range);
  }

  return {
    transactions,
    viewState,
    latest,
    income,
    expense,
    currencyCode,
    // What is listed stays, but a refresh, e.g. after a saved change, could not bring it up to date.
    refreshFailed: hasRefreshError,
    retryRefresh: () => {
      rangeQuery.refetch();
      if (!filter) latestQuery.refetch();
    },
    refetch: rangeQuery.refetch,
    retryLatest: latestQuery.refetch,
  };
};

export default useTransactionsData;
