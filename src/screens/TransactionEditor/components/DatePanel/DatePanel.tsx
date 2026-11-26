import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import Button from '@components/Buttons/Button/Button';
import CalendarGrid from '@components/Period/RangePicker/CalendarGrid';
import useBoundedHeight from '@components/Modals/BottomSheetModal/useBoundedHeight';
import useThemedStyles from '@hooks/useThemedStyles';
import { useAppDispatch } from '@redux/hooks';
import { dateApplied, pendingDatePicked } from '@redux/state/transactionFlow/slice';
import theme from '@shared/theme';
import type { CalendarDate } from '@shared/utils';
import { fromPickerDate, MIN_CALENDAR_DATE, shiftDays, shiftMonths, startOfMonth, toPickerDate } from '@shared/utils';
import useToday from '../../hooks/useToday';

import createStyles from './style';

const MIN_DATE = toPickerDate(MIN_CALENDAR_DATE);

interface Props {
  pending: CalendarDate;
  onCancel: () => void;
}

// The date picker's sheet over the form: one calendar day, no time. It picks into the flow's pending value; only
// Apply moves it into the draft, while Cancel, Back and a swipe drop it.
const DatePanel = ({ pending, onCancel }: Props) => {
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { height } = useBoundedHeight();
  const today = useToday();
  const [month, setMonth] = useState(() => startOfMonth(pending));

  // A day after today cannot be picked, even one the grid showed before midnight.
  const pick = (date: CalendarDate) => {
    const picked = date > today ? today : date;

    dispatch(pendingDatePicked({ date: picked }));
    setMonth(startOfMonth(picked));
  };

  const quickDays = [
    { label: 'Today', date: today },
    { label: 'Yesterday', date: shiftDays(today, -1) },
  ];
  const picked = toPickerDate(pending);

  return (
    <View style={{ maxHeight: height }}>
      <Text style={styles.title} accessibilityRole="header">
        Date
      </Text>

      <BottomSheetScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.quickRow}>
          {quickDays.map(({ label, date }) => {
            const isActive = pending === date;

            return (
              <TouchableOpacity
                key={label}
                style={[styles.quickChip, isActive && styles.quickChipActive]}
                onPress={() => pick(date)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.quickText, isActive && styles.quickTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <CalendarGrid
          month={toPickerDate(month)}
          range={{ from: picked, to: picked }}
          onSelectDay={(day) => pick(fromPickerDate(day))}
          onNavigate={(delta) => setMonth(shiftMonths(month, delta))}
          maxDate={toPickerDate(today)}
          minDate={MIN_DATE}
        />

        <Text style={styles.note}>Future days aren’t available.</Text>
      </BottomSheetScrollView>

      <View style={[styles.footer, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
        <Button title="Apply" onPress={() => dispatch(dateApplied())} />
        <Button title="Cancel" variant="tertiary" onPress={onCancel} />
      </View>
    </View>
  );
};

export default DatePanel;
