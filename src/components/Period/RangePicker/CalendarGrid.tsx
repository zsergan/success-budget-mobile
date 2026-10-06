import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import { formatMonthYear, getCalendarMonthGrid } from '@shared/utils';

import styles from './style';

const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  month: Date;
  range: { from: Date; to: Date };
  onSelectDay: (date: Date) => void;
  // Without it the grid shows no month header and stays on the month it was given.
  onNavigate?: (delta: 1 | -1) => void;
  // Days after it can't be picked, and the grid doesn't step past its month.
  maxDate?: Date;
}

const CalendarGrid = ({ month, range, onSelectDay, onNavigate, maxDate }: Props) => {
  const days = getCalendarMonthGrid(month, range);
  const rows = Array.from({ length: 6 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const lastDay = maxDate && new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59, 999);
  const isLastMonth =
    !!maxDate && month.getFullYear() === maxDate.getFullYear() && month.getMonth() >= maxDate.getMonth();

  return (
    <View style={styles.calendarRoot}>
      {onNavigate && (
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navButton} onPress={() => onNavigate(-1)} activeOpacity={0.7}>
            <Icon name="back" size={14} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>

          <Text style={styles.monthLabel}>{formatMonthYear(month)}</Text>

          <TouchableOpacity
            style={[styles.navButton, isLastMonth && styles.navButtonDisabled]}
            onPress={() => onNavigate(1)}
            disabled={isLastMonth}
            activeOpacity={0.7}
          >
            <Icon name="forward" size={14} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dowRow}>
        {DOW_LABELS.map((label, index) => (
          <View key={`${label}-${index}`} style={styles.dowCell}>
            <Text style={styles.dowLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {row.map((day) => {
            const isEdge = day.isRangeStart || day.isRangeEnd;
            // Approximates the design's gradient-edged pill band with a flat
            // tint between the edges plus a solid circle on the edges.
            const showBand = day.isInRange && !isEdge;
            const isAfterMax = !!lastDay && day.date.getTime() > lastDay.getTime();

            return (
              <TouchableOpacity
                key={day.date.toISOString()}
                style={[styles.dayCell, showBand && styles.dayCellBand, isAfterMax && styles.dayCellDisabled]}
                onPress={() => onSelectDay(day.date)}
                disabled={!day.inCurrentMonth || isAfterMax}
                activeOpacity={0.6}
              >
                <View style={[styles.dayCircle, isEdge && styles.dayCircleActive]}>
                  <Text
                    style={[styles.dayText, !day.inCurrentMonth && styles.dayTextMuted, isEdge && styles.dayTextActive]}
                  >
                    {day.inCurrentMonth ? day.date.getDate() : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default CalendarGrid;
