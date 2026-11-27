import { useMemo } from 'react';
import type { SkipToken } from '@reduxjs/toolkit/query';
import { skipToken } from '@reduxjs/toolkit/query';

import type { Money } from '@api/dto';
import { ApiErrorCode } from '@api/dto';
import { useTransactionsFeed } from '@hooks';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectCurrentSpaceCurrencyCode, selectCurrentSpaceId } from '@redux/state/space/selectors';
import { feedSelection, feedSelectionKey, periodArg, useGetLatestTransactionQuery } from '@redux/state/transaction/api';
import type { FeedSelection, TransactionsArg } from '@redux/state/transaction/api';
import { getEmptyPeriodState } from '@redux/state/transaction/selectors';
import type { AssignmentKey } from '@api/models';
import type { TransactionType } from '@shared/enums';
import { TransactionKind } from '@shared/enums';
import type { HistoryFilter } from '@shared/types';
import type { DateRange, DayGroup } from '@shared/utils';
import { groupRowsByDay, pickerRangeDates } from '@shared/utils';

// trueEmpty: no transactions at all; filteredEmpty: none in this period; noMatches: none behind a Stats row;
// noSearchMatches: none for the search in this period; noFilterMatches: none of the type or assignment picked.
// latestError: the period is empty but whether any transactions exist couldn't be checked.
export type TransactionsViewState =
  | 'loading'
  | 'trueEmpty'
  | 'filteredEmpty'
  | 'noMatches'
  | 'noSearchMatches'
  | 'noFilterMatches'
  | 'ready'
  | 'rangeError'
  | 'latestError';

// What History is narrowed to besides its period and search.
export interface HistoryFilters {
  transactionType?: TransactionType;
  assignment?: AssignmentKey;
  // How the place the filter came from named the assignment.
  assignmentName?: string;
}

export const hasHistoryFilters = ({ transactionType, assignment }: HistoryFilters) =>
  transactionType !== undefined || assignment !== undefined;

// A type filter lists regular records only, so its sum is the one Home and Stats show; starting balances are not part
// of income or expenses.
export const historyFilterArg = ({ transactionType, assignment }: HistoryFilters) => ({
  ...(transactionType && { transactionType, kind: TransactionKind.REGULAR }),
  ...(assignment && { assignment }),
});

export interface HistorySection extends DayGroup {
  // The server's net of the whole day; null if it did not send one for this day.
  total: Money | null;
}

interface ListedRows {
  // The rows on screen, top first, kept in view when the history is refreshed after a change.
  getVisibleIds?: () => string[];
}

interface HistoryRange extends ListedRows {
  range: DateRange;
  // Open the period at this record's page instead of its newest one.
  aroundId?: string;
  // Search text, trimmed; empty for the plain history.
  q?: string;
  filters?: HistoryFilters;
}

interface StatsSelection extends ListedRows {
  // The transactions behind a Stats row: its dates go to the API exactly as Stats got them.
  filter: HistoryFilter;
}

type UseTransactionsDataProps = HistoryRange | StatsSelection;

const toFilterArg = ({
  spaceId,
  fromDate,
  toDate,
  transactionType,
  kind,
  categoryId,
  assignment,
}: HistoryFilter): TransactionsArg => ({
  spaceId,
  fromDate,
  toDate,
  transactionType,
  kind,
  ...(categoryId !== undefined ? { categoryId } : { assignment }),
});

const useTransactionsData = (props: UseTransactionsDataProps) => {
  const spaceId = useAppSelector(selectCurrentSpaceId);
  const currencyCode = useAppSelector(selectCurrentSpaceCurrencyCode);
  const filter = 'filter' in props ? props.filter : null;
  const history = 'filter' in props ? null : props;
  const q = history?.q;

  let selection: FeedSelection | SkipToken = skipToken;
  // A selection from another space is never listed under this one's currency and actions.
  if (filter && filter.spaceId === spaceId) {
    selection = feedSelection(toFilterArg(filter));
  } else if (history && spaceId !== null) {
    selection = feedSelection(
      { ...periodArg(spaceId, history.range), ...historyFilterArg(history.filters ?? {}) },
      { q },
    );
  }
  const feed = useTransactionsFeed(selection, { aroundId: history?.aroundId, getVisibleIds: props.getVisibleIds });
  const { items, summary, dayNets } = feed;
  const isEmpty = !feed.isLoading && !feed.hasError && items.length === 0;

  // Whether the account has any history at all only matters for an empty period.
  const spaceArg = useSpaceArg();
  const isFiltered = !!history?.filters && hasHistoryFilters(history.filters);
  const needsLatest = history !== null && !q && !isFiltered && isEmpty;
  const latestQuery = useGetLatestTransactionQuery(needsLatest ? spaceArg : skipToken);

  const sections = useMemo<HistorySection[]>(
    () => groupRowsByDay(items).map((group) => ({ ...group, total: dayNets[group.key] ?? null })),
    [items, dayNets],
  );

  let viewState: TransactionsViewState;

  if (feed.isLoading || (filter && selection === skipToken)) {
    viewState = 'loading';
  } else if (feed.hasError) {
    viewState = 'rangeError';
  } else if (!isEmpty) {
    viewState = 'ready';
  } else if (!history) {
    viewState = 'noMatches';
  } else if (q) {
    viewState = 'noSearchMatches';
  } else if (isFiltered) {
    viewState = 'noFilterMatches';
  } else {
    viewState = getEmptyPeriodState(latestQuery, pickerRangeDates(history.range));
  }

  return {
    transactions: items,
    sections,
    // What is listed: the space, the period and search, or the Stats selection.
    selectionKey: selection === skipToken ? '' : feedSelectionKey(selection),
    viewState,
    latest: latestQuery.currentData,
    // Null until the selection has an answer, never a zero it has not confirmed.
    income: summary?.income ?? null,
    expense: summary?.expense ?? null,
    count: summary?.count ?? null,
    currencyCode,
    hasNextPage: feed.hasNextPage,
    isLoadingNextPage: feed.isLoadingNextPage,
    hasNextPageError: feed.hasNextPageError,
    loadNextPage: feed.loadNextPage,
    hasPreviousPage: feed.hasPreviousPage,
    isLoadingPreviousPage: feed.isLoadingPreviousPage,
    hasPreviousPageError: feed.hasPreviousPageError,
    loadPreviousPage: feed.loadPreviousPage,
    missedAroundId: feed.missedAroundId,
    // A member filter of someone the space no longer knows is refused; the screen drops it.
    isMemberFilterRefused: feed.error?.statusCode === 403 && feed.error.code === ApiErrorCode.FORBIDDEN_MEMBER,
    // What is listed stays, but a refresh, e.g. after a saved change, could not bring it up to date.
    refreshFailed: feed.hasRefreshError,
    retryRefresh: feed.retry,
    retry: feed.retry,
    // Everything listed asked for again from the newest record, as a pull or a tab tap does.
    refresh: () => {
      feed.refresh();
      if (!latestQuery.isUninitialized) latestQuery.refetch();
    },
    isReloading: feed.isReloading,
    retryLatest: () => {
      if (!latestQuery.isUninitialized) latestQuery.refetch();
    },
  };
};

export default useTransactionsData;
