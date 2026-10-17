import { Text, TouchableOpacity, View } from 'react-native';

import { useThemedStyles } from '@hooks';
import type { BreakdownMode } from '@screens/Stats/statsItems';
import type { TransactionType } from '@shared/enums';
import BreakdownTypeToggle from '../BreakdownTypeToggle/BreakdownTypeToggle';

import createStyles from './style';

const MODES: { value: BreakdownMode; label: string }[] = [
  { value: 'category', label: 'By category' },
  { value: 'wallet', label: 'By wallet' },
];

interface Props {
  type: TransactionType;
  mode: BreakdownMode;
  onTypeChange: (type: TransactionType) => void;
  onModeChange: (mode: BreakdownMode) => void;
}

const BreakdownHeader = ({ type, mode, onTypeChange, onModeChange }: Props) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Breakdown</Text>

      <BreakdownTypeToggle value={type} onChange={onTypeChange} />

      <View style={styles.modes}>
        {MODES.map((option) => {
          const active = option.value === mode;

          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => !active && onModeChange(option.value)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BreakdownHeader;
