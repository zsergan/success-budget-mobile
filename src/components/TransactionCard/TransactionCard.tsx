import { Text, View } from 'react-native';

import type { TransactionModel } from '@api/models';
import Icon from '../Icon/Icon';
import { formatAmount, formatDateHHMM } from '@shared/utils';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  transaction: TransactionModel;
}

const TransactionCard = ({ transaction }: Props) => {
  const isIncome = transaction.transactionType === TransactionType.INCOME;
  const walletName = transaction.wallet ? transaction.wallet.wallet_name : 'Deleted wallet';
  const time = formatDateHHMM(transaction.timestamp);
  const meta = transaction.description
    ? `${transaction.description} · ${walletName} · ${time}`
    : `${walletName} · ${time}`;

  return (
    <View style={styles.root}>
      <View style={styles.categoryNameTime}>
        <View style={[styles.iconBox, isIncome ? styles.iconBoxIncome : styles.iconBoxExpense]}>
          <Icon name={transaction.category.icon} size={20} color={isIncome ? colors.ok : colors.text} />
        </View>

        <View style={styles.textColumn}>
          <Text style={styles.category} numberOfLines={1}>
            {transaction.category.name}
          </Text>

          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </View>

      <Text style={[styles.amount, isIncome && styles.income]}>
        {formatAmount(transaction.amount, transaction.transactionType, transaction.currency.code)}
      </Text>
    </View>
  );
};

export default TransactionCard;
