import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import type { HistoryFilter } from '@shared/types';
import { formatCurrencyAmount, formatRangeLabel } from '@shared/utils';

import styles from './style';

interface Props {
  filter: HistoryFilter;
  total: number;
  currencyCode?: string;
  onClear: () => void;
}

const AppliedFilter = ({ filter, total, currencyCode, onClear }: Props) => {
  const isExpense = filter.transactionType === TransactionType.EXPENSE;
  const range = formatRangeLabel({ from: new Date(filter.from), to: new Date(filter.to) });

  return (
    <View style={styles.root} testID="applied-filter">
      <View style={styles.iconBox}>
        <Icon
          name={filter.walletId !== undefined ? 'wallet' : 'filter'}
          size={17}
          color={colors.text}
          strokeWidth={1.8}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {filter.name}
        </Text>

        <Text style={styles.caption} numberOfLines={1}>
          {`${isExpense ? 'Expenses' : 'Income'} · ${range}`}
        </Text>
      </View>

      <Text style={styles.total}>{formatCurrencyAmount(total, currencyCode)}</Text>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={onClear}
        activeOpacity={0.6}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Clear filter"
      >
        <Icon name="close" size={13} color={colors.text} strokeWidth={2.1} />
      </TouchableOpacity>
    </View>
  );
};

export default AppliedFilter;
