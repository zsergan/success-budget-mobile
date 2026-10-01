import { Text, TouchableOpacity, View } from 'react-native';

import type { BreakdownMode } from '@screens/Stats/statsItems';

import styles from './style';

const MODES: { value: BreakdownMode; label: string }[] = [
  { value: 'category', label: 'By category' },
  { value: 'wallet', label: 'By wallet' },
];

interface Props {
  mode: BreakdownMode;
  showModes: boolean;
  onModeChange: (mode: BreakdownMode) => void;
}

const BreakdownHeader = ({ mode, showModes, onModeChange }: Props) => (
  <View style={styles.root}>
    <Text style={styles.title}>Spending breakdown</Text>

    {showModes && (
      <View style={styles.modes}>
        {MODES.map((option) => {
          const active = option.value === mode;

          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onModeChange(option.value)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    )}
  </View>
);

export default BreakdownHeader;
