import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import Button from '@components/Buttons/Button/Button';
import CalendarGrid from '@components/Period/RangePicker/CalendarGrid';
import useThemedStyles from '@hooks/useThemedStyles';
import { useAppDispatch } from '@redux/hooks';
import { dateTimeApplied, pendingDateChanged } from '@redux/state/transactionFlow/slice';
import theme from '@shared/theme';
import { addMonths } from '@shared/utils';
import { compareDays } from '@shared/utils/compare';
import { MIN_TIMESTAMP } from '@redux/state/transactionFlow/draft';
import { formatDateTime } from '@components/TransactionFlow/format';
import useBoundedHeight from '@components/Modals/BottomSheetModal/useBoundedHeight';
import type { PickBounds } from './pickDateTime';
import { pickDay, pickTime } from './pickDateTime';
import TimeField from './TimeField';
import useNow from './useNow';

import createStyles from './style';

const MIN_DATE = new Date(MIN_TIMESTAMP);

interface Props {
  pending: string;
  // The date the draft started from, whose seconds a pick on the same minute keeps.
  original: string;
  onCancel: () => void;
}

// The date picker's sheet over the form. It picks into the flow's pending value; only Apply moves it into the draft,
// while Cancel, Back and a swipe drop it.
const DateTimePanel = ({ pending, original, onCancel }: Props) => {
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { height } = useBoundedHeight();
  const now = useNow();
  const picked = new Date(pending);
  const [month, setMonth] = useState(() => new Date(picked.getFullYear(), picked.getMonth(), 1));

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isToday = compareDays(picked, now);

  // Bounded by the time of the tap itself, not of the last render.
  const change = (pick: (bounds: PickBounds) => string) => {
    const timestamp = pick({ now: new Date(), original });
    const date = new Date(timestamp);

    dispatch(pendingDateChanged({ timestamp }));
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const quickDays = [
    { label: 'Today', day: now },
    { label: 'Yesterday', day: yesterday },
  ];

  return (
    <View style={{ maxHeight: height }}>
      <Text style={styles.title} accessibilityRole="header">
        Date & time
      </Text>

      <BottomSheetScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.quickRow}>
          {quickDays.map(({ label, day }) => {
            const isActive = compareDays(picked, day);

            return (
              <TouchableOpacity
                key={label}
                style={[styles.quickChip, isActive && styles.quickChipActive]}
                onPress={() => change((bounds) => pickDay(pending, day, bounds))}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickText, isActive && styles.quickTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <CalendarGrid
          month={month}
          range={{ from: picked, to: picked }}
          onSelectDay={(day) => change((bounds) => pickDay(pending, day, bounds))}
          onNavigate={(delta) => setMonth(addMonths(month, delta))}
          maxDate={now}
          minDate={MIN_DATE}
        />

        {isToday && <Text style={styles.note}>Later times are unavailable: a transaction can’t be in the future.</Text>}

        <View style={styles.timeRow}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.summary}>{formatDateTime(pending, now)}</Text>
        </View>

        <TimeField
          value={picked}
          maximumDate={isToday ? now : undefined}
          onChange={(time) => change((bounds) => pickTime(pending, time, bounds))}
        />
      </BottomSheetScrollView>

      <View style={[styles.footer, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
        <Button title="Apply" onPress={() => dispatch(dateTimeApplied())} />
        <Button title="Cancel" variant="tertiary" onPress={onCancel} />
      </View>
    </View>
  );
};

export default DateTimePanel;
