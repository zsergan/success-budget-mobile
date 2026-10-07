import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
  Banner,
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
import { TransactionType } from '@shared/enums';
import type { ScreenNames } from '@shared/enums';
import type { MainTabNavigationProp, MainTabScreenProps, RevealTransaction } from '@shared/types';
import { groupTransactionsByDay } from '@shared/utils';
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

  if (reveal && reveal !== revealed) {
    setRevealed(reveal);
    if (reveal.spaceId === spaceId) {
      openMonthOf(reveal.timestamp);
      setHighlightId(reveal.transactionId);
    }
  }

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
            categoryId: filter.categoryId,
            walletId: filter.walletId,
          },
        }
      : rangeSelection(range),
  );
  const {
    transactions,
    viewState,
    latest,
    income,
    expense,
    currencyCode,
    refreshFailed,
    retryRefresh,
    refetch,
    retryLatest,
  } = useTransactionsData({
    range,
    filter,
  });
  const isHighlightListed = transactions.some(({ id }) => id === highlightId);

  // The light fades only once the row is on screen, however long its month takes to load.
  useEffect(() => {
    if (!isHighlightListed) return;

    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [isHighlightListed]);

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
          groups={viewState === 'ready' ? groupTransactionsByDay(transactions) : []}
          currencyCode={currencyCode}
          onPressTransaction={openDetails}
          onDeleteTransaction={requestDelete}
          highlightId={highlightId}
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

              {refreshFailed && (
                <View style={styles.banner}>
                  <Banner
                    tone="danger"
                    text="Couldn’t update the list. It shows what was loaded before."
                    actionLabel="Retry"
                    onAction={retryRefresh}
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

              {viewState === 'rangeError' && <TransactionsEmptyState variant="rangeError" onRetry={refetch} />}

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
