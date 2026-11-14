import { Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
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

const TypeToggle = ({ value, onChange }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.typeSwitch} accessibilityRole="tablist">
      {TYPES.map(({ type, label, icon, tone }) => {
        const active = value === type;
        const color = colors[tone];

        return (
          <TouchableOpacity
            key={type}
            style={[styles.typeTab, active && styles.typeTabActive]}
            onPress={() => onChange(type)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Icon name={icon} size={15} color={active ? color : colors.muted} strokeWidth={2.3} />
            <Text style={[styles.typeTabText, { color: active ? color : colors.muted }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default TypeToggle;
