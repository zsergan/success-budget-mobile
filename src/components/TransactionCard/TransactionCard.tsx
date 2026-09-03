import { Text, View } from 'react-native';

import type { TransactionModel } from '@api/models';
import CircleIcon from '../CircleIcon/CircleIcon';
import { formatDateHHMM } from '@shared/utils';
import { TransactionType } from '@shared/enums';

import { colors } from '@shared/theme';
import styles from './style';

interface Props {
  transaction: TransactionModel;
}

const TransactionCard = ({ transaction }: Props) => (
  <View style={styles.root}>
    <View style={styles.categoryNameTime}>
      <CircleIcon
        icon={transaction.category.icon}
        size="lg"
        color={transaction.category.color}
        circleColor={colors.bg}
      />

      <View>
        <Text style={styles.category}>{transaction.category.name}</Text>

        <Text style={styles.time}>{formatDateHHMM(transaction.timestamp)}</Text>
      </View>
    </View>

    <View style={styles.amountWallet}>
      <Text
        style={[styles.amount, transaction.transactionType === TransactionType.INCOME ? styles.income : styles.expense]}
      >
        {transaction.transactionType === TransactionType.INCOME
          ? `${transaction.amount} ${transaction.currency.code}`
          : `- ${transaction.amount} ${transaction.currency.code}`}
      </Text>

      <Text style={styles.wallet}>{transaction.wallet ? transaction.wallet.wallet_name : 'Deleted wallet'}</Text>
    </View>
  </View>
);

export default TransactionCard;
