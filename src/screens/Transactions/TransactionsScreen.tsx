import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { RootLayout, SectionTitle, TransactionCard } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { compareDays, formatDateDDMMYYYY } from '@shared/utils';

import styles from './style';

const TransactionsScreen = () => {
  const dispatch = useAppDispatch();
  const { transactions } = useAppSelector(selectTransaction);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  return (
    <RootLayout scrollable>
      <SectionTitle title="Your transactions" />

      <View style={styles.transactionsContainer}>
        {transactions.map((transaction, index) => (
          <View key={transaction.id}>
            {(index === 0 || !compareDays(transactions[index - 1].timestamp, transaction.timestamp)) && (
              <Text style={[styles.date, index !== 0 && styles.mt24]}>{formatDateDDMMYYYY(transaction.timestamp)}</Text>
            )}

            <TransactionCard transaction={transaction} />
          </View>
        ))}
      </View>
    </RootLayout>
  );
};

export default TransactionsScreen;
