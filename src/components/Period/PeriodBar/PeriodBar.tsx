import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import type { Period, PeriodUnit } from '@shared/utils';
import { formatRangeLabel, getPeriodUnit, toDateRange } from '@shared/utils';

import styles from './style';

const PRESETS: { value: PeriodUnit; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

interface Props {
  period: Period;
  onPresetPress: (unit: PeriodUnit) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const PeriodBar = ({ period, onPresetPress, onOpenPicker, onReset }: Props) => (
  <View style={styles.root}>
    <View style={styles.rangeRow}>
      <TouchableOpacity style={styles.rangeButton} onPress={onOpenPicker} activeOpacity={0.7}>
        <Icon name="calendar" size={17} color={colors.accent} strokeWidth={1.8} />

        <Text style={styles.rangeLabel} numberOfLines={1}>
          {formatRangeLabel(toDateRange(period))}
        </Text>

        <Icon name="chevron-down" size={14} color={colors.muted} strokeWidth={2} />
      </TouchableOpacity>

      {period.kind === 'custom' && (
        <TouchableOpacity style={styles.resetChip} onPress={onReset} activeOpacity={0.7}>
          <Icon name="close" size={13} color={colors.text} strokeWidth={2.1} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      )}
    </View>

    <View style={styles.presetsRow}>
      {PRESETS.map((preset) => {
        const active = getPeriodUnit(period) === preset.value;

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
  </View>
);

export default PeriodBar;
