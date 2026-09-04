import { useEffect, useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetModal as BottomModal, Fab, Icon, TransactionCard, TransactionForm } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { selectRangeTransactions } from '@redux/state/transaction/selectors';
import { fetchLatestTransaction, fetchTransactionsInRange } from '@redux/state/transaction/thunks';
import { selectProfile } from '@redux/state/profile/selectors';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import type { DateRange } from '@shared/utils';
import { formatNumber, getCurrentMonthRange, groupTransactionsByDay } from '@shared/utils';

import styles from './style';

const TransactionsScreen = () => {
  const dispatch = useAppDispatch();
  // Static "this month" for now — the filter bar and range picker that let
  // this change land in later steps of this redesign.
  const [activeRange] = useState<DateRange>(() => getCurrentMonthRange());

  const expenseBottomSheetRef = useRef<BottomSheetModal>(null);
  const incomeBottomSheetRef = useRef<BottomSheetModal>(null);

  const handlePresentExpenseModalPress = () => expenseBottomSheetRef.current?.present();
  const handlePresentIncomeModalPress = () => incomeBottomSheetRef.current?.present();

  const rangeTransactions = useAppSelector(selectRangeTransactions);
  const { baseCurrency } = useAppSelector(selectProfile);

  const refreshRange = () => dispatch(fetchTransactionsInRange({ from: activeRange.from, to: activeRange.to }));

  useEffect(() => {
    refreshRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeRange.from.getTime(), activeRange.to.getTime()]);

  useEffect(() => {
    dispatch(fetchLatestTransaction());
  }, [dispatch]);

  const groups = groupTransactionsByDay(rangeTransactions, baseCurrency?.code);

  return (
    <>
      <BottomModal ref={expenseBottomSheetRef} onDismiss={refreshRange}>
        <TransactionForm initialWalletIndex={0} />
      </BottomModal>

      <BottomModal ref={incomeBottomSheetRef} onDismiss={refreshRange}>
        <TransactionForm initialWalletIndex={0} transactionType={TransactionType.INCOME} />
      </BottomModal>

      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>

          <TouchableOpacity style={styles.searchButton} hitSlop={8}>
            <Icon name="search" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

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
      </SafeAreaView>

      <Fab onExpense={handlePresentExpenseModalPress} onIncome={handlePresentIncomeModalPress} />
    </>
  );
};

export default TransactionsScreen;
