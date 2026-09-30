import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView, useBottomSheet } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import theme, { colors } from '@shared/theme';
import type { Period, PeriodUnit } from '@shared/utils';
import {
  addMonths,
  customPeriod,
  currentPeriod,
  daysInRange,
  formatDateLong,
  getPeriodUnit,
  isPeriodTooLong,
  MAX_CUSTOM_DAYS,
  toDateRange,
} from '@shared/utils';
import CalendarGrid from './CalendarGrid';
import type { RangeField } from './pickDay';
import { pickDay } from './pickDay';

import styles from './style';

const QUICK_PRESETS: { value: PeriodUnit | 'custom'; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  period: Period;
  onApply: (period: Period) => void;
}

// The modal unmounts this on close, so every opening drafts from the applied period
// and closing without Apply leaves it untouched.
const RangePickerSheet = ({ period, onApply }: Props) => {
  const { close } = useBottomSheet();
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState(period);
  const [editingField, setEditingField] = useState<RangeField>('from');
  const draftRange = toDateRange(draft);
  const [visibleMonth, setVisibleMonth] = useState(draftRange.from);

  const days = daysInRange(draftRange);
  const isTooLong = isPeriodTooLong(draft);
  const activeQuick = getPeriodUnit(draft) ?? 'custom';

  const handleQuickPreset = (value: PeriodUnit | 'custom') => {
    if (value === 'custom') {
      setDraft(customPeriod(draftRange.from, draftRange.to));
      return;
    }

    const next = currentPeriod(value);
    setDraft(next);
    setEditingField('from');
    setVisibleMonth(toDateRange(next).from);
  };

  const handleSelectDay = (date: Date) => {
    const { period: next, nextField } = pickDay(draftRange, editingField, date);
    setDraft(next);
    setEditingField(nextField);
  };

  const handleApply = () => {
    onApply(draft);
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
          const active = activeQuick === preset.value;

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
          <Text style={styles.fromToValue}>{formatDateLong(draftRange.from)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fromToChip, editingField === 'to' && styles.fromToChipActive]}
          onPress={() => setEditingField('to')}
          activeOpacity={0.7}
        >
          <Text style={styles.fromToLabel}>To</Text>
          <Text style={styles.fromToValue}>{formatDateLong(draftRange.to)}</Text>
        </TouchableOpacity>
      </View>

      <CalendarGrid
        month={visibleMonth}
        range={draftRange}
        onSelectDay={handleSelectDay}
        onNavigate={(delta) => setVisibleMonth(addMonths(visibleMonth, delta))}
      />

      <Text style={[styles.summary, isTooLong && styles.summaryError]}>
        {isTooLong ? `${days} days selected · up to ${MAX_CUSTOM_DAYS}` : `${days} days selected`}
      </Text>

      <TouchableOpacity
        style={[
          styles.applyButton,
          isTooLong && styles.applyButtonDisabled,
          { marginBottom: theme.spacing.xl + insets.bottom },
        ]}
        onPress={handleApply}
        disabled={isTooLong}
        activeOpacity={0.85}
      >
        <Text style={styles.applyButtonText}>Apply period</Text>
      </TouchableOpacity>
    </BottomSheetScrollView>
  );
};

export default RangePickerSheet;
