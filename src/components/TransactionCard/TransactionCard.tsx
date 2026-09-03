import { Text, View } from 'react-native';

import type { TransactionModel } from '@api/models';
import Icon from '../Icon/Icon';
import { formatDateHHMM } from '@shared/utils';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  transaction: TransactionModel;
}

const TransactionCard = ({ transaction }: Props) => {
  const isIncome = transaction.transactionType === TransactionType.INCOME;

  return (
    <View style={styles.root}>
      <View style={styles.categoryNameTime}>
        <View style={[styles.iconBox, isIncome ? styles.iconBoxIncome : styles.iconBoxExpense]}>
          <Icon name={transaction.category.icon} size={20} color={isIncome ? colors.ok : colors.text} />
        </View>

        <View>
          <Text style={styles.category}>{transaction.category.name}</Text>

          <Text style={styles.time}>{formatDateHHMM(transaction.timestamp)}</Text>
        </View>
      </View>

      <View style={styles.amountWallet}>
        <Text style={[styles.amount, isIncome && styles.income]}>
          {isIncome
            ? `${transaction.amount} ${transaction.currency.code}`
            : `- ${transaction.amount} ${transaction.currency.code}`}
        </Text>

        <Text style={styles.wallet}>{transaction.wallet ? transaction.wallet.wallet_name : 'Deleted wallet'}</Text>
      </View>
    </View>
  );
};

export default TransactionCard;
