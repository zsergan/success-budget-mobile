import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  Banner,
  PendingWritesBanner,
  BottomSheetModal as BottomModal,
  Fab,
  RangePickerSheet,
  ScreenFrame,
  useTransactionDelete,
  useTransactionFlow,
} from '@components';
import { usePeriod, useSpaceRefresh } from '@hooks';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { rangeSelection } from '@redux/state/transactionFlow/selection';
import { monthPeriodOf, toDateRange } from '@shared/utils';
import { TransactionType } from '@shared/enums';
import type { ScreenNames } from '@shared/enums';
import type { MainTabNavigationProp, MainTabScreenProps, RevealTransaction } from '@shared/types';
import AppliedFilter from './components/AppliedFilter/AppliedFilter';
import FilterBar from './components/FilterBar/FilterBar';
import RangeCount from './components/RangeCount/RangeCount';
import TransactionsSkeleton from './components/Skeleton/TransactionsSkeleton';
import TransactionsEmptyState from './components/TransactionsEmptyState/TransactionsEmptyState';
import TransactionsHeader from './components/TransactionsHeader/TransactionsHeader';
import TransactionsList from './components/TransactionsList/TransactionsList';
import useTransactionsData from './hooks/useTransactionsData';

import styles from './style';

const HIGHLIGHT_MS = 2500;

const TransactionsScreen = () => {
  useSpaceRefresh();
  const navigation = useNavigation<MainTabNavigationProp<ScreenNames.TRANSACTIONS_TAB>>();
  const route = useRoute<MainTabScreenProps<ScreenNames.TRANSACTIONS_TAB>['route']>();
  const { requestDelete } = useTransactionDelete();
  const rangePickerRef = useRef<BottomSheetModal>(null);

  const handleOpenPicker = () => rangePickerRef.current?.present();

  const spaceId = useAppSelector(selectCurrentSpaceId);
  const requestedFilter = route.params?.filter;
  const filter = requestedFilter?.spaceId === spaceId ? requestedFilter : null;
  const clearFilter = () => navigation.setParams({ filter: undefined });

  // A filter left from another space must not come back when that space is selected again.
  useEffect(() => {
    if (requestedFilter && requestedFilter.spaceId !== spaceId) navigation.setParams({ filter: undefined });
  }, [navigation, requestedFilter, spaceId]);

  const { period, range, canReset, applyPeriod, selectCurrent, resetPeriod, openMonthOf } = usePeriod();

  // Show from a confirmation: the record's month with no filter, its row scrolled to and lit for a moment.
  // The user's period changes only on this explicit request.
  const reveal = route.params?.reveal;
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<RevealTransaction | undefined>(undefined);

  // The revealed record is where its month opens, and stays so until another period is picked.
  const [anchor, setAnchor] = useState<RevealTransaction | null>(null);
  const isShownMonth = (timestamp: string) => {
    const month = toDateRange(monthPeriodOf(timestamp));

    return month.from.getTime() === range.from.getTime() && month.to.getTime() === range.to.getTime();
  };
  if (anchor && !isShownMonth(anchor.timestamp)) setAnchor(null);

  // Read when the history is refreshed after a change, to keep these rows in the new window.
  const visibleIdsRef = useRef<string[]>([]);
  const getVisibleIds = useCallback(() => visibleIdsRef.current, []);

  useEffect(() => {
    if (reveal) navigation.setParams({ reveal: undefined, filter: undefined });
  }, [navigation, reveal]);

  const { openCreate, openDetails } = useTransactionFlow(
    filter
      ? {
          from: filter.from,
          to: filter.to,
          filter: {
            name: filter.name,
            transactionType: filter.transactionType,
            kind: filter.kind,
            categoryId: filter.categoryId,
            walletId: filter.walletId,
          },
        }
      : rangeSelection(range),
  );
  const {
    transactions,
    sections,
    viewState,
    latest,
    income,
    expense,
    currencyCode,
    hasNextPage,
    isLoadingNextPage,
    hasNextPageError,
    loadNextPage,
    hasPreviousPage,
    isLoadingPreviousPage,
    hasPreviousPageError,
    loadPreviousPage,
    refreshFailed,
    retry,
    retryLatest,
    missedAroundId,
  } = useTransactionsData({
    range,
    filter,
    aroundId: anchor && !filter && anchor.spaceId === spaceId ? anchor.transactionId : undefined,
    getVisibleIds,
  });

  // A record already listed is only scrolled to; any other opens its month, without a filter, around it.
  if (reveal && reveal !== revealed) {
    setRevealed(reveal);
    if (reveal.spaceId === spaceId) {
      const isListed =
        !filter && isShownMonth(reveal.timestamp) && transactions.some(({ id }) => id === reveal.transactionId);

      if (!isListed) {
        openMonthOf(reveal.timestamp);
        setAnchor(reveal);
      }
      setHighlightId(reveal.transactionId);
    }
  }

  // The record is gone or no longer in its month: the period opens at its newest record and says so.
  const [dismissedMissId, setDismissedMissId] = useState<string | null>(null);
  const missedReveal =
    missedAroundId !== undefined && missedAroundId === anchor?.transactionId && missedAroundId !== dismissedMissId
      ? missedAroundId
      : null;
  if (missedReveal && highlightId === missedReveal) setHighlightId(null);
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
          renderRangeNote={(draft) => <RangeCount range={draft} />}
        />
      </BottomModal>

      <ScreenFrame edges={['top', 'left', 'right']} blurredStatusBar>
        <TransactionsList
          groups={viewState === 'ready' ? sections : []}
          currencyCode={currencyCode}
          onPressTransaction={openDetails}
          onDeleteTransaction={requestDelete}
          highlightId={highlightId}
          onHighlightSeen={() => setSeenId(highlightId)}
          onVisibleRowsChange={(ids) => {
            visibleIdsRef.current = ids;
          }}
          older={{
            hasMore: hasNextPage,
            isLoading: isLoadingNextPage,
            hasError: hasNextPageError,
            onReached: loadNextPage,
          }}
          newer={{
            hasMore: hasPreviousPage,
            isLoading: isLoadingPreviousPage,
            hasError: hasPreviousPageError,
            onReached: loadPreviousPage,
          }}
          onRetryPage={retry}
          header={
            <>
              <TransactionsHeader />

              {filter ? (
                <AppliedFilter
                  filter={filter}
                  total={filter.transactionType === TransactionType.INCOME ? income : expense}
                  currencyCode={currencyCode}
                  onClear={clearFilter}
                />
              ) : (
                <FilterBar
                  period={period}
                  income={income}
                  expense={expense}
                  currencyCode={currencyCode}
                  onPresetPress={selectCurrent}
                  onOpenPicker={handleOpenPicker}
                  onReset={resetPeriod}
                />
              )}

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

              {viewState === 'noMatches' && <TransactionsEmptyState variant="noMatches" onClearFilter={clearFilter} />}

              {viewState === 'rangeError' && <TransactionsEmptyState variant="rangeError" onRetry={retry} />}

              {viewState === 'latestError' && <TransactionsEmptyState variant="latestError" onRetry={retryLatest} />}
            </>
          }
        />
      </ScreenFrame>

      {viewState !== 'loading' && (
        <Fab
          onExpense={() => openCreate(TransactionType.EXPENSE)}
          onIncome={() => openCreate(TransactionType.INCOME)}
        />
      )}
    </>
  );
};

export default TransactionsScreen;
