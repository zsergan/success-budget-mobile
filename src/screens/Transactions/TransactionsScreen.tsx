import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Card, Divider, RootLayout } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { selectHolding } from '@redux/state/holding/selectors';
import { compareDays, formatDateDDMMYYYY, formatAmount } from '@shared/utils';
import { TransactionType } from '@shared/enums';

import styles from './style';

const TransactionsScreen = () => {
  const dispatch = useAppDispatch();
  const { holdings } = useAppSelector(selectHolding);
  const { transactions } = useAppSelector(selectTransaction);

  useEffect(() => {
    if (holdings[0]?.holding.id) {
      dispatch(fetchTransactions(holdings[0].holding.id));
    }
  }, [dispatch, holdings]);

  return (
    <RootLayout style={styles.root} scrollable>
      <View style={styles.transactionsContainer}>
        {transactions.map((transaction, index) => (
          <View key={transaction.id}>
            {(index === 0 || !compareDays(transactions[index - 1].timestamp, transaction.timestamp)) && (
              <Text style={[styles.date, index !== 0 && styles.mt16]}>{formatDateDDMMYYYY(transaction.timestamp)}</Text>
            )}

            <Card customStyle={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{transaction.category?.name}</Text>

                <Text
                  style={[
                    styles.amount,
                    transaction.transaction_type === TransactionType.INCOME ? styles.income : styles.expense,
                  ]}
                >
                  {formatAmount(transaction.amount, transaction.transaction_type, holdings[0].holding.currency.code)}
                </Text>
              </View>

              {transaction.description && (
                <>
                  <Divider />

                  <Text style={styles.description}>{transaction.description}</Text>
                </>
              )}
            </Card>
          </View>
        ))}
      </View>
    </RootLayout>
  );
};

export default TransactionsScreen;
