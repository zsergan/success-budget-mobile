import { useEffect, useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetModal as BottomModal, EmptyState, Fab, Icon, TransactionCard, TransactionForm } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import {
  selectIsLoadingRange,
  selectLatestTransaction,
  selectPeriodTotals,
  selectRangeTransactions,
} from '@redux/state/transaction/selectors';
import { fetchLatestTransaction, fetchTransactionsInRange } from '@redux/state/transaction/thunks';
import { selectProfile } from '@redux/state/profile/selectors';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import type { DateRange } from '@shared/utils';
import {
  formatDateDDMMYYYY,
  formatNumber,
  formatRangeLabel,
  getCurrentMonthRange,
  getCurrentWeekRange,
  getCurrentYearRange,
  getMonthRange,
  groupTransactionsByDay,
} from '@shared/utils';
import FilterBar from './FilterBar/FilterBar';
import RangePickerSheet from './RangePicker/RangePickerSheet';
import TransactionsSkeleton from './Skeleton/TransactionsSkeleton';

import styles from './style';

const TransactionsScreen = () => {
  const dispatch = useAppDispatch();
  const [activeRange, setActiveRange] = useState<DateRange>(() => getCurrentMonthRange());

  const expenseBottomSheetRef = useRef<BottomSheetModal>(null);
  const incomeBottomSheetRef = useRef<BottomSheetModal>(null);
  const rangePickerRef = useRef<BottomSheetModal>(null);

  const handlePresentExpenseModalPress = () => expenseBottomSheetRef.current?.present();
  const handlePresentIncomeModalPress = () => incomeBottomSheetRef.current?.present();
  const handleOpenPicker = () => rangePickerRef.current?.present();

  const rangeTransactions = useAppSelector(selectRangeTransactions);
  const isLoadingRange = useAppSelector(selectIsLoadingRange);
  const latest = useAppSelector(selectLatestTransaction);
  const { income, expense, currencyCode } = useAppSelector(selectPeriodTotals);
  const { baseCurrency } = useAppSelector(selectProfile);

  const refreshRange = () => dispatch(fetchTransactionsInRange({ from: activeRange.from, to: activeRange.to }));

  const handlePresetPress = (preset: 'week' | 'month' | 'year') => {
    if (preset === 'week') setActiveRange(getCurrentWeekRange());
    else if (preset === 'month') setActiveRange(getCurrentMonthRange());
    else setActiveRange(getCurrentYearRange());
  };

  const handleReset = () => setActiveRange(getCurrentMonthRange());

  const handleJumpToLatest = () => {
    if (!latest) return;

    setActiveRange({ ...getMonthRange(latest.timestamp), preset: 'custom' });
  };

  useEffect(() => {
    refreshRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeRange.from.getTime(), activeRange.to.getTime()]);

  useEffect(() => {
    dispatch(fetchLatestTransaction());
  }, [dispatch]);

  const groups = groupTransactionsByDay(rangeTransactions, baseCurrency?.code);

  // latest === undefined means "not fetched yet" — treat that as still
  // loading too, or the wrong empty-state variant flashes on cold start.
  const showSkeleton = isLoadingRange || (rangeTransactions.length === 0 && latest === undefined);
  const showTrueEmpty = !showSkeleton && latest === null;
  const showFilteredEmpty = !showSkeleton && latest !== null && rangeTransactions.length === 0;
  const showList = !showSkeleton && rangeTransactions.length > 0;

  return (
    <>
      <BottomModal ref={expenseBottomSheetRef} onDismiss={refreshRange}>
        <TransactionForm initialWalletIndex={0} />
      </BottomModal>

      <BottomModal ref={incomeBottomSheetRef} onDismiss={refreshRange}>
        <TransactionForm initialWalletIndex={0} transactionType={TransactionType.INCOME} />
      </BottomModal>

      <BottomModal ref={rangePickerRef} dynamicSizing>
        <RangePickerSheet activeRange={activeRange} onApply={setActiveRange} />
      </BottomModal>

      <SafeAreaView style={styles.root}>
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
          onPresetPress={handlePresetPress}
          onOpenPicker={handleOpenPicker}
          onReset={handleReset}
        />

        {showSkeleton && <TransactionsSkeleton />}

        {showTrueEmpty && (
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

        {showFilteredEmpty && latest && (
          <View style={styles.emptyContainer}>
            <EmptyState
              variant="solid"
              icon="calendar"
              title="Nothing in this period"
              description={`No transactions between ${formatRangeLabel(activeRange)}. Your last one was on ${formatDateDDMMYYYY(latest.timestamp)}.`}
              actionLabel="Reset to this month"
              actionVariant="secondary"
              onActionPress={handleReset}
              secondaryActionLabel={`Jump to ${formatDateDDMMYYYY(latest.timestamp)}`}
              onSecondaryActionPress={handleJumpToLatest}
            />
          </View>
        )}

        {showList && (
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
                      <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {!showSkeleton && <Fab onExpense={handlePresentExpenseModalPress} onIncome={handlePresentIncomeModalPress} />}
    </>
  );
};

export default TransactionsScreen;
