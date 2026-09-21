import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TransactionComposerHandle } from '@components';
import { BottomSheetModal as BottomModal, Fab, TransactionComposer } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { groupTransactionsByDay } from '@shared/utils';
import FilterBar from './components/FilterBar/FilterBar';
import RangePickerSheet from './components/RangePicker/RangePickerSheet';
import TransactionsSkeleton from './components/Skeleton/TransactionsSkeleton';
import TransactionsEmptyState from './components/TransactionsEmptyState/TransactionsEmptyState';
import TransactionsHeader from './components/TransactionsHeader/TransactionsHeader';
import TransactionsList from './components/TransactionsList/TransactionsList';
import useTransactionRange from './hooks/useTransactionRange';
import useTransactionsData from './hooks/useTransactionsData';

import styles from './style';

const TransactionsScreen = () => {
  const composerRef = useRef<TransactionComposerHandle>(null);
  const rangePickerRef = useRef<BottomSheetModal>(null);

  const handleOpenPicker = () => rangePickerRef.current?.present();

  const { activeRange, setActiveRange, setPresetRange, resetRange, jumpToMonthOf } = useTransactionRange();
  const { transactions, viewState, latest, income, expense, currencyCode, refetch } = useTransactionsData({
    range: activeRange,
  });

  const { wallets } = useAppSelector(selectWallet);
  const firstWalletId = wallets[0]?.wallet.id ?? -1;

  return (
    <>
      <TransactionComposer ref={composerRef} initialWalletId={firstWalletId} onDismiss={refetch} />

      <BottomModal ref={rangePickerRef} dynamicSizing>
        <RangePickerSheet activeRange={activeRange} onApply={setActiveRange} />
      </BottomModal>

      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
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

        {viewState === 'loading' && <TransactionsSkeleton />}

        {viewState === 'trueEmpty' && (
          <TransactionsEmptyState variant="trueEmpty" onAddTransaction={() => composerRef.current?.openExpense()} />
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

        {viewState === 'ready' && (
          <TransactionsList groups={groupTransactionsByDay(transactions, currencyCode)} currencyCode={currencyCode} />
        )}
      </SafeAreaView>

      {viewState !== 'loading' && (
        <Fab onExpense={() => composerRef.current?.openExpense()} onIncome={() => composerRef.current?.openIncome()} />
      )}
    </>
  );
};

export default TransactionsScreen;
