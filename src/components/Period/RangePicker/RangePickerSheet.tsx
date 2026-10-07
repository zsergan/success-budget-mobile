import type { ReactNode } from 'react';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView, useBottomSheet } from '@gorhom/bottom-sheet';

import Icon from '@components/Icon/Icon';
import theme, { colors } from '@shared/theme';
import type { DateRange, Period, PeriodUnit } from '@shared/utils';
import {
  addMonths,
  customPeriod,
  currentPeriod,
  daysInRange,
  formatDateLong,
  isPeriodTooLong,
  MAX_CUSTOM_DAYS,
  shiftPeriod,
  toDateRange,
  unitPeriodOf,
} from '@shared/utils';
import CalendarGrid from './CalendarGrid';
import PeriodStepper from './PeriodStepper';
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
  // A note on the drafted range, e.g. how many records it holds; Apply never waits for it.
  renderRangeNote?: (range: DateRange) => ReactNode;
}

// The modal unmounts this on close, so every opening drafts from the applied period
// and closing without Apply leaves it untouched.
const RangePickerSheet = ({ period, onApply, renderRangeNote }: Props) => {
  const { close } = useBottomSheet();
  const insets = useSafeAreaInsets();

  const [draft, setDraft] = useState(period);
  const [editingField, setEditingField] = useState<RangeField>('from');
  const draftRange = toDateRange(draft);
  const [visibleMonth, setVisibleMonth] = useState(draftRange.from);

  const days = daysInRange(draftRange);
  const isTooLong = isPeriodTooLong(draft);
  const stepUnit = draft.kind === 'custom' ? null : draft.unit;
  const activeQuick = stepUnit ?? 'custom';

  const showStandard = (next: Period) => {
    setDraft(next);
    setVisibleMonth(toDateRange(next).from);
  };

  const handleQuickPreset = (value: PeriodUnit | 'custom') => {
    if (value === 'custom') {
      setDraft(customPeriod(draftRange.from, draftRange.to));
      setEditingField('from');
      return;
    }

    showStandard(currentPeriod(value));
  };

  // A Week or Month takes the whole unit around the picked day; only Custom builds a range of days.
  const handleSelectDay = (date: Date) => {
    if (draft.kind !== 'custom') {
      setDraft(unitPeriodOf(draft.unit, date));
      return;
    }

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

      {draft.kind === 'custom' ? (
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
      ) : (
        <PeriodStepper
          period={draft}
          onStep={(delta) => showStandard(shiftPeriod(draft, delta))}
          onSelectCurrent={() => showStandard(currentPeriod(draft.unit))}
        />
      )}

      {/* A year is stepped whole, and a month by the stepper; the grid's own arrows are for Week and Custom. */}
      {stepUnit !== 'year' && (
        <CalendarGrid
          month={visibleMonth}
          range={draftRange}
          onSelectDay={handleSelectDay}
          onNavigate={stepUnit === 'month' ? undefined : (delta) => setVisibleMonth(addMonths(visibleMonth, delta))}
        />
      )}

      <Text style={[styles.summary, isTooLong && styles.summaryError]}>
        {isTooLong ? `${days} days selected · up to ${MAX_CUSTOM_DAYS}` : `${days} days selected`}
      </Text>

      {!isTooLong && renderRangeNote?.(draftRange)}

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
