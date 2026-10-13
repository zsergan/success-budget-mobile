import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import type { Money } from '@api/dto';
import { useTransactionsFeed } from '@hooks';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { feedSelection, periodArg, useGetLatestTransactionQuery } from '@redux/state/transaction/api';
import type { TransactionsArg } from '@redux/state/transaction/api';
import { getEmptyPeriodState } from '@redux/state/transaction/selectors';
import type { HistoryFilter } from '@shared/types';
import type { DateRange, DayGroup } from '@shared/utils';
import { groupRowsByDay } from '@shared/utils';

// trueEmpty: no transactions at all; filteredEmpty: none in this period; noMatches: none under a Stats filter.
// latestError: the period is empty but whether any transactions exist couldn't be checked.
export type TransactionsViewState =
  'loading' | 'trueEmpty' | 'filteredEmpty' | 'noMatches' | 'ready' | 'rangeError' | 'latestError';

export interface HistorySection extends DayGroup {
  // The server's net of the whole day; null if it did not send one for this day.
  total: Money | null;
}

const ZERO: Money = '0.00';

interface UseTransactionsDataProps {
  range: DateRange;
  // Replaces the period: its bounds go to the API exactly as Stats got them.
  filter: HistoryFilter | null;
  // Open the period at this record's page instead of its newest one.
  aroundId?: string;
}

const toFilterArg = ({
  spaceId,
  from,
  to,
  transactionType,
  kind,
  categoryId,
  walletId,
}: HistoryFilter): TransactionsArg => ({
  spaceId,
  from,
  to,
  transactionType,
  kind,
  ...(categoryId !== undefined ? { categoryId } : { walletId }),
});

const useTransactionsData = ({ range, filter, aroundId }: UseTransactionsDataProps) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);

  const feed = useTransactionsFeed(
    spaceId === null ? skipToken : feedSelection(filter ? toFilterArg(filter) : periodArg(spaceId, range)),
    { aroundId },
  );
  const { items, summary, dayNets } = feed;
  const isEmpty = !feed.isLoading && !feed.hasError && items.length === 0;

  // Whether the account has any history at all only matters for an empty period.
  const spaceArg = useSpaceArg();
  const needsLatest = !filter && isEmpty;
  const latestQuery = useGetLatestTransactionQuery(needsLatest ? spaceArg : skipToken);

  const sections = useMemo<HistorySection[]>(
    () => groupRowsByDay(items).map((group) => ({ ...group, total: dayNets[group.key] ?? null })),
    [items, dayNets],
  );

  let viewState: TransactionsViewState;

  if (feed.isLoading) {
    viewState = 'loading';
  } else if (feed.hasError) {
    viewState = 'rangeError';
  } else if (!isEmpty) {
    viewState = 'ready';
  } else if (filter) {
    viewState = 'noMatches';
  } else {
    viewState = getEmptyPeriodState(latestQuery, range);
  }

  return {
    transactions: items,
    sections,
    viewState,
    latest: latestQuery.currentData,
    income: summary?.income ?? ZERO,
    expense: summary?.expense ?? ZERO,
    currencyCode,
    hasNextPage: feed.hasNextPage,
    isLoadingNextPage: feed.isLoadingNextPage,
    hasNextPageError: feed.hasNextPageError,
    loadNextPage: feed.loadNextPage,
    hasPreviousPage: feed.hasPreviousPage,
    isLoadingPreviousPage: feed.isLoadingPreviousPage,
    hasPreviousPageError: feed.hasPreviousPageError,
    loadPreviousPage: feed.loadPreviousPage,
    // What is listed stays, but a refresh, e.g. after a saved change, could not bring it up to date.
    refreshFailed: feed.hasRefreshError,
    retryRefresh: feed.retry,
    retry: feed.retry,
    retryLatest: () => {
      if (!latestQuery.isUninitialized) latestQuery.refetch();
    },
  };
};

export default useTransactionsData;
