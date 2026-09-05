import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';
import type { DateRange, PeriodPreset } from '@shared/utils';
import { formatCurrencyAmount, formatRangeLabel } from '@shared/utils';

import styles from './style';

type Preset = Extract<PeriodPreset, 'week' | 'month' | 'year'>;

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

interface Props {
  range: DateRange;
  income: number;
  expense: number;
  currencyCode?: string;
  onPresetPress: (preset: Preset) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const FilterBar = ({ range, income, expense, currencyCode, onPresetPress, onOpenPicker, onReset }: Props) => (
  <View style={styles.root}>
    <View style={styles.rangeRow}>
      <TouchableOpacity style={styles.rangeButton} onPress={onOpenPicker} activeOpacity={0.7}>
        <Icon name="calendar" size={17} color={colors.accent} strokeWidth={1.8} />

        <Text style={styles.rangeLabel} numberOfLines={1}>
          {formatRangeLabel(range)}
        </Text>

        <Icon name="chevron-down" size={14} color={colors.muted} strokeWidth={2} />
      </TouchableOpacity>

      {range.preset === 'custom' && (
        <TouchableOpacity style={styles.resetChip} onPress={onReset} activeOpacity={0.7}>
          <Icon name="close" size={13} color={colors.text} strokeWidth={2.1} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>

    <View style={styles.presetsRow}>
      {PRESETS.map((preset) => {
        const active = range.preset === preset.value;

        return (
          <TouchableOpacity
            key={preset.value}
            style={[styles.presetChip, active && styles.presetChipActive]}
            onPress={() => onPresetPress(preset.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.presetText, active && styles.presetTextActive]}>{preset.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>

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
