import { Text, View } from 'react-native';

import type { Transaction } from '@api/dto';
import CircleIcon from '../CircleIcon/CircleIcon';
import { formatDateHHMM } from '@shared/utils';
import { TransactionType } from '@shared/enums';

import styles from './style';

interface Props {
  transaction: Transaction;
}

const TransactionCard = ({ transaction }: Props) => (
  <View style={styles.root}>
    <View style={styles.categoryNameTime}>
      <CircleIcon icon="attach-money" size="lg" border />

      <View>
        <Text style={styles.category}>{transaction.category.name}</Text>

        <Text style={styles.time}>{formatDateHHMM(transaction.timestamp)}</Text>
      </View>
    </View>

    <View style={styles.amountWallet}>
      <Text
        style={[
          styles.amount,
          transaction.transaction_type === TransactionType.INCOME ? styles.income : styles.expense,
        ]}
      >
        {transaction.transaction_type === TransactionType.INCOME
          ? `${transaction.amount} ${transaction.currency.code}`
          : `- ${transaction.amount} ${transaction.currency.code}`}
      </Text>

      <Text style={styles.wallet}>{transaction.wallet ? transaction.wallet.wallet_name : 'Deleted wallet'}</Text>
    </View>
  </View>
);

export default TransactionCard;
