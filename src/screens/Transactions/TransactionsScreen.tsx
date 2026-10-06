import { useEffect, useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';

import { BottomSheetModal as BottomModal, Fab, RangePickerSheet, ScreenFrame, useTransactionFlow } from '@components';
import { usePeriod } from '@hooks';
import { useAppSelector } from '@redux/hooks';
import { selectCurrentSpaceId } from '@redux/state/space/selectors';
import { TransactionType } from '@shared/enums';
import type { ScreenNames } from '@shared/enums';
import type { MainTabNavigationProp, MainTabScreenProps } from '@shared/types';
import { groupTransactionsByDay } from '@shared/utils';
import AppliedFilter from './components/AppliedFilter/AppliedFilter';
import FilterBar from './components/FilterBar/FilterBar';
import TransactionsSkeleton from './components/Skeleton/TransactionsSkeleton';
import TransactionsEmptyState from './components/TransactionsEmptyState/TransactionsEmptyState';
import TransactionsHeader from './components/TransactionsHeader/TransactionsHeader';
import TransactionsList from './components/TransactionsList/TransactionsList';
import useTransactionsData from './hooks/useTransactionsData';

const TransactionsScreen = () => {
  const navigation = useNavigation<MainTabNavigationProp<ScreenNames.TRANSACTIONS_TAB>>();
  const route = useRoute<MainTabScreenProps<ScreenNames.TRANSACTIONS_TAB>['route']>();
  const { openCreate, openDetails } = useTransactionFlow();
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
  const { transactions, viewState, latest, income, expense, currencyCode, refetch, retryLatest } = useTransactionsData({
    range,
    filter,
  });

  return (
    <>
      <BottomModal ref={rangePickerRef} dynamicSizing>
        <RangePickerSheet period={period} onApply={applyPeriod} />
      </BottomModal>

      <ScreenFrame edges={['top', 'left', 'right']} blurredStatusBar>
        <TransactionsList
          groups={viewState === 'ready' ? groupTransactionsByDay(transactions, currencyCode) : []}
          currencyCode={currencyCode}
          onPressTransaction={openDetails}
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
