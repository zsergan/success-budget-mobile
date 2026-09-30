import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { TransactionComposerHandle } from '@components';
import { BottomSheetModal as BottomModal, Fab, RangePickerSheet, ScreenFrame, TransactionComposer } from '@components';
import { usePeriod } from '@hooks';
import { useSpaceArg } from '@redux/hooks';
import { useGetWalletsQuery } from '@redux/state/wallet/api';
import { groupTransactionsByDay } from '@shared/utils';
import FilterBar from './components/FilterBar/FilterBar';
import TransactionsSkeleton from './components/Skeleton/TransactionsSkeleton';
import TransactionsEmptyState from './components/TransactionsEmptyState/TransactionsEmptyState';
import TransactionsHeader from './components/TransactionsHeader/TransactionsHeader';
import TransactionsList from './components/TransactionsList/TransactionsList';
import useTransactionsData from './hooks/useTransactionsData';

const TransactionsScreen = () => {
  const composerRef = useRef<TransactionComposerHandle>(null);
  const rangePickerRef = useRef<BottomSheetModal>(null);

  const handleOpenPicker = () => rangePickerRef.current?.present();

  const { period, range, canReset, applyPeriod, selectCurrent, resetPeriod, openMonthOf } = usePeriod();
  const { transactions, viewState, latest, income, expense, currencyCode, refetch, retryLatest } = useTransactionsData({
    range,
  });

  const { currentData: walletsOverview } = useGetWalletsQuery(useSpaceArg());
  const firstWalletId = walletsOverview?.wallets[0]?.wallet.id ?? -1;

  return (
    <>
      <TransactionComposer ref={composerRef} initialWalletId={firstWalletId} />

      <BottomModal ref={rangePickerRef} dynamicSizing>
        <RangePickerSheet period={period} onApply={applyPeriod} />
      </BottomModal>

      <ScreenFrame edges={['top', 'left', 'right']} blurredStatusBar>
        <TransactionsList
          groups={viewState === 'ready' ? groupTransactionsByDay(transactions, currencyCode) : []}
          currencyCode={currencyCode}
          header={
            <>
              <TransactionsHeader />

              <FilterBar
                period={period}
                income={income}
                expense={expense}
                currencyCode={currencyCode}
                onPresetPress={selectCurrent}
                onOpenPicker={handleOpenPicker}
                onReset={resetPeriod}
              />
            </>
          }
          placeholder={
            <>
              {viewState === 'loading' && <TransactionsSkeleton />}

              {viewState === 'trueEmpty' && (
                <TransactionsEmptyState
                  variant="trueEmpty"
                  onAddTransaction={() => composerRef.current?.openExpense()}
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

              {viewState === 'rangeError' && <TransactionsEmptyState variant="rangeError" onRetry={refetch} />}

              {viewState === 'latestError' && <TransactionsEmptyState variant="latestError" onRetry={retryLatest} />}
            </>
          }
        />
      </ScreenFrame>

      {viewState !== 'loading' && (
        <Fab onExpense={() => composerRef.current?.openExpense()} onIncome={() => composerRef.current?.openIncome()} />
      )}
    </>
  );
};

export default TransactionsScreen;
