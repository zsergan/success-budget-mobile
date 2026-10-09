import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';

import styles from './style';

const TYPES = [
  { type: TransactionType.INCOME, label: 'Income', icon: 'income', color: colors.ok },
  { type: TransactionType.EXPENSE, label: 'Expense', icon: 'expense', color: colors.danger },
] as const;

interface Props {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

const TypeToggle = ({ value, onChange }: Props) => (
  <View style={styles.typeSwitch}>
    {TYPES.map(({ type, label, icon, color }) => {
      const active = value === type;

      return (
        <TouchableOpacity
          key={type}
          style={[styles.typeTab, active && styles.typeTabActive]}
          onPress={() => onChange(type)}
          activeOpacity={0.7}
        >
          <Icon name={icon} size={15} color={active ? color : colors.muted} strokeWidth={2.3} />
          <Text style={[styles.typeTabText, { color: active ? color : colors.muted }]}>{label}</Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default TypeToggle;
