import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView, useBottomSheet } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import theme, { colors } from '@shared/theme';
import type { DateRange, PeriodPreset } from '@shared/utils';
import {
  addMonths,
  daysInRange,
  endOfDay,
  formatDateLong,
  getCurrentMonthRange,
  getCurrentWeekRange,
  getCurrentYearRange,
  startOfDay,
} from '@shared/utils';
import CalendarGrid from './CalendarGrid';

import styles from './style';

const QUICK_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  activeRange: DateRange;
  onApply: (range: DateRange) => void;
}

const RangePickerSheet = ({ activeRange, onApply }: Props) => {
  const { close } = useBottomSheet();
  const insets = useSafeAreaInsets();

  const [tentativeFrom, setTentativeFrom] = useState(activeRange.from);
  const [tentativeTo, setTentativeTo] = useState(activeRange.to);
  const [tentativePreset, setTentativePreset] = useState<PeriodPreset>(activeRange.preset);
  const [editingField, setEditingField] = useState<'from' | 'to'>('from');
  const [visibleMonth, setVisibleMonth] = useState(activeRange.from);

  // Resets the tentative fields whenever the committed activeRange changes
  // (React's "adjusting state during render" pattern — no effect needed).
  const [syncedRange, setSyncedRange] = useState(activeRange);

  if (syncedRange !== activeRange) {
    setSyncedRange(activeRange);
    setTentativeFrom(activeRange.from);
    setTentativeTo(activeRange.to);
    setTentativePreset(activeRange.preset);
    setEditingField('from');
    setVisibleMonth(activeRange.from);
  }

  const handleQuickPreset = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      setTentativePreset('custom');
      return;
    }

    const range =
      preset === 'week' ? getCurrentWeekRange() : preset === 'month' ? getCurrentMonthRange() : getCurrentYearRange();

    setTentativeFrom(range.from);
    setTentativeTo(range.to);
    setTentativePreset(preset);
    setVisibleMonth(range.from);
  };

  const handleSelectDay = (date: Date) => {
    setTentativePreset('custom');

    if (editingField === 'from') {
      setTentativeFrom(startOfDay(date));
      setEditingField('to');
      return;
    }

    const picked = endOfDay(date);

    // Swap rather than allow an inverted range if "to" lands before "from".
    if (picked.getTime() < tentativeFrom.getTime()) {
      setTentativeTo(endOfDay(tentativeFrom));
      setTentativeFrom(startOfDay(date));
    } else {
      setTentativeTo(picked);
    }

    setEditingField('from');
  };

  const handleApply = () => {
    onApply({ from: tentativeFrom, to: tentativeTo, preset: tentativePreset });
    close();
  };

  return (
    <BottomSheetScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <Text style={styles.title}>Select period</Text>

        <TouchableOpacity style={styles.closeButton} onPress={() => close()} activeOpacity={0.6} hitSlop={8}>
          <Icon name="close" size={14} color={colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickRow}>
        {QUICK_PRESETS.map((preset) => {
          const active = tentativePreset === preset.value;

          return (
            <TouchableOpacity
              key={preset.value}
              style={[styles.quickChip, active && styles.quickChipActive]}
              onPress={() => handleQuickPreset(preset.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickText, active && styles.quickTextActive]}>{preset.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.fromToRow}>
        <TouchableOpacity
          style={[styles.fromToChip, editingField === 'from' && styles.fromToChipActive]}
          onPress={() => setEditingField('from')}
          activeOpacity={0.7}
        >
          <Text style={styles.fromToLabel}>From</Text>
          <Text style={styles.fromToValue}>{formatDateLong(tentativeFrom)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fromToChip, editingField === 'to' && styles.fromToChipActive]}
          onPress={() => setEditingField('to')}
          activeOpacity={0.7}
        >
          <Text style={styles.fromToLabel}>To</Text>
          <Text style={styles.fromToValue}>{formatDateLong(tentativeTo)}</Text>
        </TouchableOpacity>
      </View>

      <CalendarGrid
        month={visibleMonth}
        range={{ from: tentativeFrom, to: tentativeTo }}
        onSelectDay={handleSelectDay}
        onNavigate={(delta) => setVisibleMonth(addMonths(visibleMonth, delta))}
      />

      <Text style={styles.summary}>{daysInRange({ from: tentativeFrom, to: tentativeTo })} days selected</Text>

      <TouchableOpacity
        style={[styles.applyButton, { marginBottom: theme.spacing.xl + insets.bottom }]}
        onPress={handleApply}
        activeOpacity={0.85}
      >
        <Text style={styles.applyButtonText}>Apply period</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
};

export default RangePickerSheet;
