import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';

import styles from './style';

const TYPES = [
  { type: TransactionType.EXPENSE, label: 'Expense', icon: 'expense', color: colors.danger },
  { type: TransactionType.INCOME, label: 'Income', icon: 'income', color: colors.ok },
] as const;

interface Props {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

const BreakdownTypeToggle = ({ value, onChange }: Props) => (
  <View style={styles.root}>
    {TYPES.map(({ type, label, icon, color }) => {
      const active = value === type;

      return (
        <TouchableOpacity
          key={type}
          style={[styles.tab, active && styles.tabActive]}
          onPress={() => !active && onChange(type)}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
        >
          <Icon name={icon} size={13} color={active ? color : colors.muted} strokeWidth={2.4} />
          <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default BreakdownTypeToggle;
