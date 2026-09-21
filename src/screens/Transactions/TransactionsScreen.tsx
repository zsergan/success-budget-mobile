import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetModal as BottomModal, Fab, TransactionForm } from '@components';
import { TRANSACTION_FORM_SNAP_POINT } from '@components/TransactionForm/TransactionForm';
import { useAppSelector } from '@redux/hooks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { TransactionType } from '@shared/enums';
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
  const expenseBottomSheetRef = useRef<BottomSheetModal>(null);
  const incomeBottomSheetRef = useRef<BottomSheetModal>(null);
  const rangePickerRef = useRef<BottomSheetModal>(null);

  const handlePresentExpenseModalPress = () => expenseBottomSheetRef.current?.present();
  const handlePresentIncomeModalPress = () => incomeBottomSheetRef.current?.present();
  const handleOpenPicker = () => rangePickerRef.current?.present();

  const { activeRange, setActiveRange, setPresetRange, resetRange, jumpToMonthOf } = useTransactionRange();
  const { transactions, viewState, latest, income, expense, currencyCode, refetch } = useTransactionsData({
    range: activeRange,
  });

  const { wallets } = useAppSelector(selectWallet);
  const firstWalletId = wallets[0]?.wallet.id ?? -1;

  return (
    <>
      <BottomModal ref={expenseBottomSheetRef} onDismiss={refetch} snapPoint={TRANSACTION_FORM_SNAP_POINT}>
        <TransactionForm initialWalletId={firstWalletId} />
      </BottomModal>

      <BottomModal ref={incomeBottomSheetRef} onDismiss={refetch} snapPoint={TRANSACTION_FORM_SNAP_POINT}>
        <TransactionForm initialWalletId={firstWalletId} transactionType={TransactionType.INCOME} />
      </BottomModal>

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
          <TransactionsEmptyState variant="trueEmpty" onAddTransaction={handlePresentExpenseModalPress} />
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
        <Fab onExpense={handlePresentExpenseModalPress} onIncome={handlePresentIncomeModalPress} />
      )}
    </>
  );
};

export default TransactionsScreen;
