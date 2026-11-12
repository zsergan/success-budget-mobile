import { Text, TouchableOpacity, View } from 'react-native';

import type { Money } from '@api/dto';
import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { TransactionType } from '@shared/enums';
import type { HistoryFilter, IconType } from '@shared/types';
import { formatMoneyAmount, formatRangeLabel } from '@shared/utils';

import createStyles from './style';

interface Props {
  filter: HistoryFilter;
  // Null until the filter has an answer.
  total: Money | null;
  currencyCode?: string;
  // Only where the filter sits on top of a history it can be taken off.
  onClear?: () => void;
}

const AppliedFilter = ({ filter, total, currencyCode, onClear }: Props) => {
  const { colors, categories } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const isExpense = filter.transactionType === TransactionType.EXPENSE;
  const range = formatRangeLabel({ from: new Date(filter.from), to: new Date(filter.to) });

  const tag = (icon: IconType, color: string, label: string, strokeWidth: number) => (
    <View style={styles.tag}>
      <Icon name={icon} size={13} color={color} strokeWidth={strokeWidth} />
      <Text style={styles.tagLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.root} testID="applied-filter">
      <View style={styles.context}>
        <View style={styles.tags}>
          {isExpense ? tag('expense', colors.danger, 'Expenses', 2.4) : tag('income', colors.ok, 'Income', 2.4)}
          {tag(filter.icon, categories[filter.color].stroke, filter.name, 2)}
        </View>

        {onClear && (
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
        )}
      </View>

      <View style={styles.summary}>
        <Text style={styles.range}>{range}</Text>

        <Text style={styles.total}>{total === null ? '—' : formatMoneyAmount(total, currencyCode)}</Text>
      </View>
    </View>
  );
};

export default AppliedFilter;
