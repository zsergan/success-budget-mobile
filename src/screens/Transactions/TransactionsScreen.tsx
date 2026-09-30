import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';

import type { TransactionComposerHandle } from '@components';
import { BottomSheetModal as BottomModal, Fab, RangePickerSheet, ScreenFrame, TransactionComposer } from '@components';
import { usePeriodRange } from '@hooks';
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

  const { activeRange, setActiveRange, setPresetRange, resetRange, jumpToMonthOf } = usePeriodRange();
  const { transactions, viewState, latest, income, expense, currencyCode, refetch, retryLatest } = useTransactionsData({
    range: activeRange,
  });

  const { currentData: walletsOverview } = useGetWalletsQuery(useSpaceArg());
  const firstWalletId = walletsOverview?.wallets[0]?.wallet.id ?? -1;

  return (
    <>
      <TransactionComposer ref={composerRef} initialWalletId={firstWalletId} />

      <BottomModal ref={rangePickerRef} dynamicSizing>
        <RangePickerSheet activeRange={activeRange} onApply={setActiveRange} />
      </BottomModal>

      <ScreenFrame edges={['top', 'left', 'right']} blurredStatusBar>
        <TransactionsList
          groups={viewState === 'ready' ? groupTransactionsByDay(transactions, currencyCode) : []}
          currencyCode={currencyCode}
          header={
            <>
              <TransactionsHeader />

              <FilterBar
                range={activeRange}
                income={income}
                expense={expense}
                currencyCode={currencyCode}
                onPresetPress={setPresetRange}
                onOpenPicker={handleOpenPicker}
                onReset={resetRange}
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
                  activeRange={activeRange}
                  onResetRange={resetRange}
                  onJumpToLatest={() => jumpToMonthOf(latest.timestamp)}
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
