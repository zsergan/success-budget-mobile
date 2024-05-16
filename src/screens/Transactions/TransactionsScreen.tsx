import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@redux/hooks';
import { fetchTransactions } from '@redux/state/transaction/thunks';
import { selectTransaction } from '@redux/state/transaction/selectors';

const TransactionsScreen = () => {
  const dispatch = useAppDispatch();
  const { transactions } = useAppSelector(selectTransaction);

  useEffect(() => {
    dispatch(fetchTransactions(1));
  }, [dispatch]);

  return (
    <View>
      {transactions.map((transaction) => (
        <View key={transaction.id}>
          <Text>{`${transaction?.category?.name}: ${transaction.amount} (${transaction.description})`}</Text>
        </View>
      ))}
    </View>
  );
};

export default TransactionsScreen;
