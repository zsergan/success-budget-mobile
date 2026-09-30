import { Text, View } from 'react-native';

import type { PeriodBarPreset } from '@components';
import { Icon, PeriodBar } from '@components';
import { colors } from '@shared/theme';
import type { DateRange } from '@shared/utils';
import { formatCurrencyAmount } from '@shared/utils';

import styles from './style';

interface Props {
  range: DateRange;
  income: number;
  expense: number;
  currencyCode?: string;
  onPresetPress: (preset: PeriodBarPreset) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const FilterBar = ({ range, income, expense, currencyCode, onPresetPress, onOpenPicker, onReset }: Props) => (
  <View style={styles.root}>
    <PeriodBar range={range} onPresetPress={onPresetPress} onOpenPicker={onOpenPicker} onReset={onReset} />

    <View style={styles.totalsRow}>
      <View style={styles.totalCard}>
        <View style={styles.totalLabelRow}>
          <Icon name="income" size={11} color={colors.ok} strokeWidth={2.4} />
          <Text style={styles.totalLabel}>Income</Text>
        </View>

        <Text style={styles.totalValue}>{formatCurrencyAmount(income, currencyCode)}</Text>
      </View>

      <View style={styles.totalCard}>
        <View style={styles.totalLabelRow}>
          <Icon name="expense" size={11} color={colors.danger} strokeWidth={2.4} />
          <Text style={styles.totalLabel}>Expense</Text>
        </View>

        <Text style={styles.totalValue}>{formatCurrencyAmount(expense, currencyCode)}</Text>
      </View>
    </View>
  </View>
);

export default FilterBar;
