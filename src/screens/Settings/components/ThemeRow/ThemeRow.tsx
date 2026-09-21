import { Text, TouchableOpacity, View } from 'react-native';

import type { ThemePreference } from '@hooks';

import styles from './style';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

interface Props {
  preference: ThemePreference;
  onChange: (next: ThemePreference) => void;
}

const ThemeRow = ({ preference, onChange }: Props) => (
  <View style={styles.themeRow}>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>Theme</Text>
      <Text style={styles.rowSub}>System follows your device setting</Text>
    </View>

    <View style={styles.themeSwitch}>
      {OPTIONS.map((option) => {
        const active = option.value === preference;

        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.themeTab, active && styles.themeTabActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.themeTabText, active && styles.themeTabTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default ThemeRow;
