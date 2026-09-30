import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import type { DateRange, PeriodPreset } from '@shared/utils';
import { formatRangeLabel } from '@shared/utils';

import styles from './style';

export type PeriodBarPreset = Extract<PeriodPreset, 'week' | 'month' | 'year'>;

const PRESETS: { value: PeriodBarPreset; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

interface Props {
  range: DateRange;
  onPresetPress: (preset: PeriodBarPreset) => void;
  onOpenPicker: () => void;
  onReset: () => void;
}

const PeriodBar = ({ range, onPresetPress, onOpenPicker, onReset }: Props) => (
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
  </View>
);

export default PeriodBar;
