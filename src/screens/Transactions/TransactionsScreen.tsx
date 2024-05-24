import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Fontisto } from '@expo/vector-icons';

import { Card, Divider, RootLayout } from '@components';
import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { selectTransaction } from '@redux/state/transaction/selectors';
import { selectWallet } from '@redux/state/wallet/selectors';
import { compareDays, formatDateDDMMYYYY, formatAmount } from '@shared/utils';
import { TransactionType } from '@shared/enums';

import styles from './style';

const TransactionsScreen = () => {
  const dispatch = useAppDispatch();
  const { wallets } = useAppSelector(selectWallet);
  const { transactions } = useAppSelector(selectTransaction);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  return (
    <RootLayout style={styles.root} scrollable>
      <View style={styles.transactionsContainer}>
        {transactions.map((transaction, index) => (
          <View key={transaction.id}>
            {(index === 0 || !compareDays(transactions[index - 1].timestamp, transaction.timestamp)) && (
              <Text style={[styles.date, index !== 0 && styles.mt16]}>{formatDateDDMMYYYY(transaction.timestamp)}</Text>
            )}

            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.transactionAndWallet}>
                  <Text style={styles.name}>{transaction.category?.name}</Text>

                  <View style={styles.walletContainer}>
                    <Fontisto name="wallet" size={16} color="black" />

                    <Text style={[styles.wallet, !transaction.wallet && styles.expense]}>
                      {transaction.wallet ? transaction.wallet.wallet_name : 'Deleted wallet'}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[
                    styles.amount,
                    transaction.transaction_type === TransactionType.INCOME ? styles.income : styles.expense,
                  ]}
                >
                  {formatAmount(transaction.amount, transaction.transaction_type, wallets[0].wallet.currency.code)}
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
