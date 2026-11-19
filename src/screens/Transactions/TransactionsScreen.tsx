import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  Banner,
  PendingWritesBanner,
  BottomSheetModal as BottomModal,
  ConfirmationSheet,
  Fab,
  RangePickerSheet,
  ScreenFrame,
  useTransactionDelete,
  useTransactionFlow,
} from '@components';
import { usePeriod, useConfirmation, useSpaceRefresh } from '@hooks';
import type { AssignmentKey } from '@api/models';
import { useAppSelector, useSpaceArg } from '@redux/hooks';
import { selectProfileId } from '@redux/state/profile/selectors';
import { useGetTransactionAssigneesQuery } from '@redux/state/transaction/api';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { rangeSelection } from '@redux/state/transactionFlow/selection';
import { monthPeriodOf, toDateRange } from '@shared/utils';
import { TransactionType } from '@shared/enums';
import type { ScreenNames } from '@shared/enums';
import type { MainTabNavigationProp, MainTabScreenProps, RevealTransaction } from '@shared/types';
import type { SearchStatus } from './components/FilterBar/FilterBar';
import FilterBar from './components/FilterBar/FilterBar';
import RangeCount from './components/RangeCount/RangeCount';
import TransactionsSkeleton from './components/Skeleton/TransactionsSkeleton';
import TransactionsEmptyState from './components/TransactionsEmptyState/TransactionsEmptyState';
import TransactionsHeader from './components/TransactionsHeader/TransactionsHeader';
import TransactionsList from './components/TransactionsList/TransactionsList';
import useSearch from './hooks/useSearch';
import FilterSheet from './components/FilterSheet/FilterSheet';
import type { FilterSheetContent } from './components/FilterSheet/FilterSheet';
import HistoryFilters from './components/HistoryFilters/HistoryFilters';
import { assigneeOptions, TYPE_OPTIONS } from './historyFilterOptions';
import type { HistoryFilters as Filters } from './hooks/useTransactionsData';
import useTransactionsData from './hooks/useTransactionsData';
import { feedListProps } from './feedListProps';
import { MAX_SEARCH_LENGTH } from './search';

import styles from './style';

const HIGHLIGHT_MS = 2500;

interface Anchor {
  spaceId: number;
  transactionId: string;
  // The period it holds for, as the range's bounds in ms.
  from: number;
  to: number;
  // Shown from elsewhere, as opposed to a place the list returns to.
  isReveal: boolean;
}

const monthBounds = (timestamp: string) => {
  const month = toDateRange(monthPeriodOf(timestamp));

  return { from: month.from.getTime(), to: month.to.getTime() };
};

const TransactionsScreen = () => {
  useSpaceRefresh();
  const navigation = useNavigation<MainTabNavigationProp<ScreenNames.TRANSACTIONS_TAB>>();
  const route = useRoute<MainTabScreenProps<ScreenNames.TRANSACTIONS_TAB>['route']>();
  const { lock: deleteLock, confirmation: deleteConfirmation } = useConfirmation();
  const { requestDelete } = useTransactionDelete(deleteLock);
  const rangePickerRef = useRef<BottomSheetModal>(null);

  const handleOpenPicker = () => rangePickerRef.current?.present();

  const spaceId = useAppSelector(selectCurrentSpaceId);

  const { period, range, canReset, applyPeriod, selectCurrent, resetPeriod, openMonthOf } = usePeriod();
  const search = useSearch();
  const q = search.submitted;
  // The type and assignment the list is narrowed to, as Home or the user set them; they belong to the space.
  const [filters, setFilters] = useState<Filters>({});
  const [openFilter, setOpenFilter] = useState<'type' | 'assignment' | null>(null);
  const selfId = useAppSelector(selectProfileId);
  const assigneesQuery = useGetTransactionAssigneesQuery(useSpaceArg());

  // Show from a confirmation: the record's month with no search, its row scrolled to and lit for a moment.
  // The user's period changes only on this explicit request.
  const reveal = route.params?.reveal;
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<RevealTransaction | undefined>(undefined);

  // Where the history opens instead of its newest record, for as long as the period it was set for is shown: a
  // record shown from elsewhere (in its month), or the row the plain history was at when a search opened.
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const isShownRange = (bounds: { from: number; to: number }) =>
    bounds.from === range.from.getTime() && bounds.to === range.to.getTime();
  const isShownMonth = (timestamp: string) => isShownRange(monthBounds(timestamp));
  if (anchor && !isShownRange(anchor)) setAnchor(null);

  // Where the plain history was when a search opened; Cancel brings it back while the period is the same.
  const [returnPoint, setReturnPoint] = useState<Anchor | null>(null);
  const [restoreId, setRestoreId] = useState<string | null>(null);
  // A restore holds only while its row still anchors the plain history: another period drops it.
  if (restoreId && anchor?.transactionId !== restoreId) setRestoreId(null);
  // The plain history was replaced by results at least once, so Cancel has a place to return to.
  const [hasLeftHistory, setHasLeftHistory] = useState(false);
  if (q && returnPoint && !hasLeftHistory) setHasLeftHistory(true);

  // A search belongs to its space: another space starts from its plain history.
  const [searchSpaceId, setSearchSpaceId] = useState(spaceId);
  if (searchSpaceId !== spaceId) {
    setSearchSpaceId(spaceId);
    setRestoreId(null);
    if (search.isSearching) search.cancel();
    setReturnPoint(null);
    setFilters({});
  }

  // Read when the history is refreshed after a change, to keep these rows in the new window.
  const visibleIdsRef = useRef<string[]>([]);
  const getVisibleIds = useCallback(() => visibleIdsRef.current, []);

  useEffect(() => {
    if (reveal) navigation.setParams({ reveal: undefined });
  }, [navigation, reveal]);

  // Home's request: its month, narrowed to a type and an assignment, once, and only in the space it was made in.
  const focus = route.params?.focus;
  const [focused, setFocused] = useState<typeof focus>(undefined);
  if (focus && focus !== focused) {
    setFocused(focus);
    if (focus.spaceId === spaceId) {
      applyPeriod(monthPeriodOf(focus.month));
      setFilters({
        transactionType: focus.transactionType,
        assignment: focus.assignment,
        assignmentName: focus.assignmentName,
      });
      setAnchor(null);
      if (search.isSearching) search.cancel();
      setReturnPoint(null);
    }
  }
  useEffect(() => {
    if (focus) navigation.setParams({ focus: undefined });
  }, [navigation, focus]);

  const { transactionType: filterType, assignment: filterAssignment } = filters;
  const viewSelection = useMemo(
    () => ({
      ...rangeSelection(range),
      ...(filterType && { transactionType: filterType }),
      ...(filterAssignment && { assignment: filterAssignment }),
    }),
    [range, filterType, filterAssignment],
  );
  const { openCreate, openDetails } = useTransactionFlow(viewSelection);
  const data = useTransactionsData({
    range,
    q,
    filters,
    aroundId: anchor && !q && anchor.spaceId === spaceId ? anchor.transactionId : undefined,
    getVisibleIds,
  });
  const {
    transactions,
    viewState,
    latest,
    income,
    expense,
    count,
    currencyCode,
    hasPreviousPage,
    refreshFailed,
    retry,
    retryLatest,
    missedAroundId,
    isMemberFilterRefused,
  } = data;

  // Someone the space no longer knows: the filter goes, and its choices are read again.
  if (isMemberFilterRefused && filters.assignment) {
    setFilters(({ assignment: _assignment, assignmentName: _name, ...rest }) => rest);
    assigneesQuery.refetch();
  }

  // Another selection starts from its first page, not around a row of the previous one.
  const changeFilters = (change: (current: Filters) => Filters) => {
    setFilters(change);
    setAnchor(null);
    setRestoreId(null);
  };

  const typeSheet: FilterSheetContent<TransactionType> = {
    title: 'Type',
    options: TYPE_OPTIONS,
    selected: filters.transactionType,
    onSelect: (transactionType) => {
      changeFilters((current) => ({ ...current, transactionType }));
      setOpenFilter(null);
    },
  };
  const assignmentChoices = assigneeOptions(assigneesQuery.currentData, selfId);
  const assignmentSheet: FilterSheetContent<AssignmentKey> = {
    title: 'Assigned to',
    description: 'Show transactions for one person or a shared bucket.',
    options: assignmentChoices,
    selected: filters.assignment,
    onSelect: (assignment) => {
      const option = assignmentChoices.find(({ value }) => value === assignment);
      changeFilters((current) => ({ ...current, assignment, assignmentName: assignment ? option?.label : undefined }));
      setOpenFilter(null);
    },
  };

  // A record already listed is only scrolled to; any other opens its month around it. A list narrowed by a search or a
  // filter is not the one the reveal shows, so its rows say nothing about where the record is in the plain month.
  if (reveal && reveal !== revealed) {
    setRevealed(reveal);
    if (reveal.spaceId === spaceId) {
      const isNarrowed = !!q || filters.transactionType !== undefined || filters.assignment !== undefined;
      const isListed =
        !isNarrowed && isShownMonth(reveal.timestamp) && transactions.some(({ id }) => id === reveal.transactionId);

      setFilters({});
      if (!isListed) {
        openMonthOf(reveal.timestamp);
        setAnchor({ ...monthBounds(reveal.timestamp), spaceId, transactionId: reveal.transactionId, isReveal: true });
        if (search.isSearching) search.cancel();
        setReturnPoint(null);
      }
      setHighlightId(reveal.transactionId);
      setRestoreId(null);
    }
  }

  // The record is gone or no longer in its month: the period opens at its newest record and says so.
  const [dismissedMissId, setDismissedMissId] = useState<string | null>(null);
  const missedReveal =
    missedAroundId !== undefined &&
    anchor?.isReveal &&
    missedAroundId === anchor.transactionId &&
    missedAroundId !== dismissedMissId
      ? missedAroundId
      : null;
  if (missedReveal && highlightId === missedReveal) setHighlightId(null);

  const openSearch = () => {
    const [topId] = visibleIdsRef.current;
    const isAtTop = !hasPreviousPage && topId === transactions[0]?.id;

    setReturnPoint(
      topId && !isAtTop && spaceId !== null
        ? { from: range.from.getTime(), to: range.to.getTime(), spaceId, transactionId: topId, isReveal: false }
        : null,
    );
    setHasLeftHistory(false);
    setRestoreId(null);
    search.open();
  };

  // Back to where the plain history was, if the period is unchanged; a new period starts at its newest record.
  const cancelSearch = () => {
    if (returnPoint && hasLeftHistory && isShownRange(returnPoint)) {
      setAnchor(returnPoint);
      setRestoreId(returnPoint.transactionId);
    }
    setReturnPoint(null);
    search.cancel();
  };

  const searchStatus: SearchStatus | undefined = !q
    ? undefined
    : viewState === 'loading'
      ? { state: 'searching' }
      : viewState === 'rangeError'
        ? { state: 'failed' }
        : { state: 'found', count: count ?? 0 };

  const [seenId, setSeenId] = useState<string | null>(null);
  const isHighlightSeen = highlightId !== null && seenId === highlightId;

  // The light fades only once the row is on screen, however long its month takes to load and the list to scroll.
  useEffect(() => {
    if (!isHighlightSeen) return;

    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [isHighlightSeen]);

  return (
    <>
      <BottomModal ref={rangePickerRef} dynamicSizing>
        <RangePickerSheet
          period={period}
          onApply={applyPeriod}
          renderRangeNote={(draft) => <RangeCount range={draft} q={q} filters={filters} />}
        />
      </BottomModal>

      <ScreenFrame edges={['top', 'left', 'right']} blurredStatusBar>
        <TransactionsList
          {...feedListProps(data)}
          onPressTransaction={openDetails}
          onDeleteTransaction={requestDelete}
          highlightId={highlightId}
          restoreId={restoreId}
          onRestored={() => setRestoreId(null)}
          onHighlightSeen={() => setSeenId(highlightId)}
          onVisibleRowsChange={(ids) => {
            visibleIdsRef.current = ids;
          }}
          header={
            <>
              <TransactionsHeader
                isSearching={search.isSearching}
                query={search.query}
                error={search.isTooLong ? `Search is limited to ${MAX_SEARCH_LENGTH} characters` : null}
                onOpen={openSearch}
                onCancel={cancelSearch}
                onChangeQuery={search.change}
                onSubmit={search.submit}
                onClear={search.clear}
              />

              <FilterBar
                period={period}
                income={income}
                expense={expense}
                isLoading={viewState === 'loading'}
                search={searchStatus}
                currencyCode={currencyCode}
                onPresetPress={selectCurrent}
                onOpenPicker={handleOpenPicker}
                onReset={resetPeriod}
              />

              <HistoryFilters
                filters={filters}
                onOpenType={() => setOpenFilter('type')}
                onOpenAssignment={() => setOpenFilter('assignment')}
                onClearType={() => changeFilters(({ transactionType: _type, ...rest }) => rest)}
                onClearAssignment={() =>
                  changeFilters(({ assignment: _assignment, assignmentName: _name, ...rest }) => rest)
                }
              />

              <PendingWritesBanner style={styles.banner} />

              {missedReveal && (
                <View style={styles.banner}>
                  <Banner
                    tone="warn"
                    text="This transaction is no longer here. Showing the whole period instead."
                    actionLabel="OK"
                    onAction={() => setDismissedMissId(missedReveal)}
                  />
                </View>
              )}

              {refreshFailed && (
                <View style={styles.banner}>
                  <Banner
                    tone="danger"
                    text="Couldn’t update the list. It shows what was loaded before."
                    actionLabel="Retry"
                    onAction={retry}
                  />
                </View>
              )}
            </>
          }
          placeholder={
            <>
              {viewState === 'loading' && <TransactionsSkeleton />}

              {viewState === 'trueEmpty' && (
                <TransactionsEmptyState
                  variant="trueEmpty"
                  onAddTransaction={() => openCreate(TransactionType.EXPENSE)}
                />
              )}

              {viewState === 'filteredEmpty' && latest && (
                <TransactionsEmptyState
                  variant="filteredEmpty"
                  latest={latest}
                  activeRange={range}
                  onResetRange={canReset ? resetPeriod : undefined}
                  onJumpToLatest={() => openMonthOf(latest.timestamp)}
                />
              )}

              {viewState === 'noFilterMatches' && (
                <TransactionsEmptyState
                  variant="noFilterMatches"
                  activeRange={range}
                  onClearFilters={() => changeFilters(() => ({}))}
                />
              )}

              {viewState === 'noSearchMatches' && (
                <TransactionsEmptyState
                  variant="noSearchMatches"
                  query={q}
                  activeRange={range}
                  onClearSearch={search.clear}
                />
              )}

              {viewState === 'rangeError' &&
                (q ? (
                  <View style={styles.banner}>
                    <Banner
                      tone="danger"
                      text="Couldn’t search. Check your connection and try again."
                      actionLabel="Try again"
                      onAction={retry}
                    />
                  </View>
                ) : (
                  <TransactionsEmptyState variant="rangeError" onRetry={retry} />
                ))}

              {viewState === 'latestError' && <TransactionsEmptyState variant="latestError" onRetry={retryLatest} />}
            </>
          }
        />
      </ScreenFrame>

      {viewState !== 'loading' && !search.isSearching && (
        <Fab
          onExpense={() => openCreate(TransactionType.EXPENSE)}
          onIncome={() => openCreate(TransactionType.INCOME)}
        />
      )}

      <FilterSheet content={openFilter === 'type' ? typeSheet : null} onClose={() => setOpenFilter(null)} />
      <FilterSheet
        content={openFilter === 'assignment' ? assignmentSheet : null}
        selfId={selfId}
        onClose={() => setOpenFilter(null)}
      />

      <ConfirmationSheet confirmation={deleteConfirmation} />
    </>
  );
};

export default TransactionsScreen;
