import { useState } from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import CalendarGrid from '@components/Period/RangePicker/CalendarGrid';
import { useAppDispatch } from '@redux/hooks';
import { dateTimeApplied, pendingDateChanged } from '@redux/state/transactionFlow/slice';
import theme from '@shared/theme';
import { addMonths } from '@shared/utils';
import { compareDays } from '@shared/utils/compare';
import { formatDateTime } from '../format';
import PanelHeader from '../PanelHeader/PanelHeader';
import { EDITOR_HEIGHT_FRACTION } from '../TransactionEditor/TransactionEditor';
import { pickDay, pickTime } from './pickDateTime';
import TimeField from './TimeField';

import styles from './style';

interface Props {
  pending: string;
  onBack: () => void;
  onClose: () => void;
}

// Picks into the flow's pending value; only Apply moves it into the draft, Back and Cancel drop it.
const DateTimePanel = ({ pending, onBack, onClose }: Props) => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const now = new Date();
  const picked = new Date(pending);
  const [month, setMonth] = useState(() => new Date(picked.getFullYear(), picked.getMonth(), 1));

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isToday = compareDays(picked, now);

  const change = (timestamp: string) => {
    const date = new Date(timestamp);

    dispatch(pendingDateChanged({ timestamp }));
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const quickDays = [
    { label: 'Today', day: now },
    { label: 'Yesterday', day: yesterday },
  ];

  return (
    <View style={{ height: windowHeight * EDITOR_HEIGHT_FRACTION }}>
      <PanelHeader title="Date & time" onBack={onBack} onClose={onClose} />

      <BottomSheetScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.quickRow}>
          {quickDays.map(({ label, day }) => {
            const isActive = compareDays(picked, day);

            return (
              <TouchableOpacity
                key={label}
                style={[styles.quickChip, isActive && styles.quickChipActive]}
                onPress={() => change(pickDay(pending, day, now))}
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
          onSelectDay={(day) => change(pickDay(pending, day, now))}
          onNavigate={(delta) => setMonth(addMonths(month, delta))}
          maxDate={now}
        />

        {isToday && <Text style={styles.note}>Later times are unavailable: a transaction can’t be in the future.</Text>}

        <View style={styles.timeRow}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.summary}>{formatDateTime(pending, now)}</Text>
        </View>

        <TimeField
          value={picked}
          maximumDate={isToday ? now : undefined}
          onChange={(time) => change(pickTime(pending, time, now))}
        />
      </BottomSheetScrollView>

      <View style={[styles.footer, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyButton} onPress={() => dispatch(dateTimeApplied())} activeOpacity={0.8}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DateTimePanel;
