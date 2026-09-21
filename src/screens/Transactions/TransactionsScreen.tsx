import { useRef } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetModal as BottomModal, EmptyState, Fab, Icon, TransactionCard, TransactionForm } from '@components';
import { TRANSACTION_FORM_SNAP_POINT } from '@components/TransactionForm/TransactionForm';
import { useAppSelector } from '@redux/hooks';
import { selectWallet } from '@redux/state/wallet/selectors';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import { formatDateDDMMYYYY, formatNumber, formatRangeLabel, groupTransactionsByDay } from '@shared/utils';
import FilterBar from './FilterBar/FilterBar';
import RangePickerSheet from './RangePicker/RangePickerSheet';
import TransactionsSkeleton from './Skeleton/TransactionsSkeleton';
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

  const groups = groupTransactionsByDay(transactions, currencyCode);

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
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>

          <TouchableOpacity style={styles.searchButton} hitSlop={8}>
            <Icon name="search" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

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
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="list"
              title="No transactions yet"
              description="Your income and expenses will show up here."
              actionLabel="Add transaction"
              actionIcon="plus"
              onActionPress={handlePresentExpenseModalPress}
            />
          </View>
        )}

        {viewState === 'filteredEmpty' && latest && (
          <View style={styles.emptyContainer}>
            <EmptyState
              variant="solid"
              icon="calendar"
              title="Nothing in this period"
              description={`No transactions between ${formatRangeLabel(activeRange)}. Your last one was on ${formatDateDDMMYYYY(latest.timestamp)}.`}
              actionLabel="Reset to this month"
              actionVariant="secondary"
              onActionPress={resetRange}
              secondaryActionLabel={`Jump to ${formatDateDDMMYYYY(latest.timestamp)}`}
              onSecondaryActionPress={() => jumpToMonthOf(latest.timestamp)}
            />
          </View>
        )}

        {viewState === 'ready' && (
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              {groups.map((group) => (
                <View key={group.label} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{group.label}</Text>

                    {group.total !== undefined && (
                      <Text style={[styles.groupTotal, group.total >= 0 && styles.groupTotalPositive]}>
                        {`${group.total >= 0 ? '+' : '-'}${formatNumber(Math.abs(group.total))}${
                          group.currencyCode ? ` ${group.currencyCode}` : ''
                        }`}
                      </Text>
                    )}
                  </View>

                  <View style={styles.groupItems}>
                    {group.items.map((transaction) => (
                      <TransactionCard key={transaction.id} transaction={transaction} currencyCode={currencyCode} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {viewState !== 'loading' && (
        <Fab onExpense={handlePresentExpenseModalPress} onIncome={handlePresentIncomeModalPress} />
      )}
    </>
  );
};

export default TransactionsScreen;
