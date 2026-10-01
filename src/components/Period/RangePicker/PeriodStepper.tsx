import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import type { Period, PeriodUnit } from '@shared/utils';
import { formatMonthYear, formatRangeLabel, toDateRange } from '@shared/utils';

import styles from './style';

const formatPeriodValue = (unit: PeriodUnit, range: { from: Date; to: Date }) => {
  if (unit === 'month') return formatMonthYear(range.from);
  if (unit === 'year') return String(range.from.getFullYear());
  return formatRangeLabel(range);
};

interface Props {
  period: Exclude<Period, { kind: 'custom' }>;
  onStep: (delta: -1 | 1) => void;
  onSelectCurrent: () => void;
}

// Steps a Week, Month or Year back and forth; the caption doubles as the way back to the current one.
const PeriodStepper = ({ period, onStep, onSelectCurrent }: Props) => {
  const { unit } = period;
  const isCurrent = period.kind === 'current';

  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => onStep(-1)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Previous ${unit}`}
      >
        <Icon name="back" size={14} color={colors.text} strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.stepperCenter}>
        <Text style={[styles.fromToValue, styles.stepperText]} numberOfLines={1}>
          {formatPeriodValue(unit, toDateRange(period))}
        </Text>

        {isCurrent ? (
          <Text style={[styles.fromToLabel, styles.stepperText]}>{`This ${unit}`}</Text>
        ) : (
          <TouchableOpacity onPress={onSelectCurrent} activeOpacity={0.6} hitSlop={8} accessibilityRole="button">
            <Text style={[styles.fromToLabel, styles.stepperText, styles.stepperLink]}>{`Back to this ${unit}`}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.navButton, isCurrent && styles.navButtonDisabled]}
        onPress={() => onStep(1)}
        disabled={isCurrent}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Next ${unit}`}
        accessibilityState={{ disabled: isCurrent }}
      >
        <Icon name="forward" size={14} color={colors.text} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

export default PeriodStepper;
