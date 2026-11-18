import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  // "October 2026".
  label: string;
  isCurrent: boolean;
  // The current month's name, for the way back from an earlier one.
  currentName: string;
  onPrevious: () => void;
  onNext: () => void;
  onBackToCurrent: () => void;
}

// The month every block of Home is about; there is no month after the current one.
const MonthNavigator = ({ label, isCurrent, currentName, onPrevious, onNext, onBackToCurrent }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <TouchableOpacity
        style={styles.arrow}
        onPress={onPrevious}
        activeOpacity={0.6}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
      >
        <Icon name="back" size={16} color={colors.text} strokeWidth={2.1} />
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.label} accessibilityRole="header">
          {label}
        </Text>

        {isCurrent ? (
          <Text style={styles.sub}>This month</Text>
        ) : (
          <TouchableOpacity onPress={onBackToCurrent} hitSlop={8} accessibilityRole="button">
            <Text style={styles.back}>{`Back to ${currentName}`}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.arrow, isCurrent && styles.arrowDisabled]}
        onPress={onNext}
        disabled={isCurrent}
        activeOpacity={0.6}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityState={{ disabled: isCurrent }}
      >
        <Icon name="forward" size={16} color={colors.text} strokeWidth={2.1} />
      </TouchableOpacity>
    </View>
  );
};

export default MonthNavigator;
