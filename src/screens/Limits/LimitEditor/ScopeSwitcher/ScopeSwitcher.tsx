import { Text, TouchableOpacity, View } from 'react-native';

import type { LimitScope } from '../types';

import styles from './style';

const SCOPES: { value: LimitScope; label: string }[] = [
  { value: 'category', label: 'One category' },
  { value: 'group', label: 'Group' },
  { value: 'total', label: 'Monthly total' },
];

interface Props {
  scope: LimitScope;
  onScopeChange: (scope: LimitScope) => void;
}

const ScopeSwitcher = ({ scope, onScopeChange }: Props) => (
  <View style={styles.scopeSwitch}>
    {SCOPES.map((item) => {
      const active = scope === item.value;

      return (
        <TouchableOpacity
          key={item.value}
          style={[styles.scopeTab, active && styles.scopeTabActive]}
          onPress={() => onScopeChange(item.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.scopeTabText, active && styles.scopeTabTextActive]}>{item.label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default ScopeSwitcher;
