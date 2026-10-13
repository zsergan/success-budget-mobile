import { Text, View } from 'react-native';

import type { Money } from '@api/dto';
import { Icon, PeriodBar } from '@components';
import { colors } from '@shared/theme';
import type { Period, PeriodUnit } from '@shared/utils';
import { formatMoneyAmount } from '@shared/utils';

import styles from './style';

interface Props {
  period: Period;
  income: Money;
  expense: Money;
  currencyCode?: string;
  onPresetPress: (unit: PeriodUnit) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const FilterBar = ({ period, income, expense, currencyCode, onPresetPress, onOpenPicker, onReset }: Props) => (
  <View style={styles.root}>
    <PeriodBar period={period} onPresetPress={onPresetPress} onOpenPicker={onOpenPicker} onReset={onReset} />

    <View style={styles.totalsRow}>
      <View style={styles.totalCard}>
        <View style={styles.totalLabelRow}>
          <Icon name="income" size={11} color={colors.ok} strokeWidth={2.4} />
          <Text style={styles.totalLabel}>Income</Text>
        </View>

        <Text style={styles.totalValue}>{formatMoneyAmount(income, currencyCode)}</Text>
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalLabelRow}>
          <Icon name="expense" size={11} color={colors.danger} strokeWidth={2.4} />
          <Text style={styles.totalLabel}>Expense</Text>
        </View>

        <Text style={styles.totalValue}>{formatMoneyAmount(expense, currencyCode)}</Text>
      </View>
    </View>
  </View>
);

export default FilterBar;
