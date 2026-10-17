import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';
import { TransactionType } from '@shared/enums';

import createStyles from './style';

const TYPES = [
  { type: TransactionType.EXPENSE, label: 'Expense', icon: 'expense', tone: 'danger' },
  { type: TransactionType.INCOME, label: 'Income', icon: 'income', tone: 'ok' },
] as const;

interface Props {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
}

const BreakdownTypeToggle = ({ value, onChange }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      {TYPES.map(({ type, label, icon, tone }) => {
        const active = value === type;
        const color = colors[tone];

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
};

export default BreakdownTypeToggle;
