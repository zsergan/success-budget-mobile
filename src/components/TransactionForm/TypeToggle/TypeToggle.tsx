import { Text, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import Icon from '@components/Icon/Icon';
import { TransactionType } from '@shared/enums';
import { colors } from '@shared/theme';
import type { TransactionFormData } from '../useTransactionForm';

import styles from './style';

interface Props {
  control: Control<TransactionFormData>;
  onTypeChange: () => void;
}

const TypeToggle = ({ control, onTypeChange }: Props) => (
  <Controller
    name="transaction_type"
    control={control}
    render={({ field: { onChange, value } }) => (
      <View style={styles.typeSwitch}>
        <TouchableOpacity
          style={[styles.typeTab, value === TransactionType.INCOME && styles.typeTabActive]}
          onPress={() => {
            onChange(TransactionType.INCOME);
            onTypeChange();
          }}
          activeOpacity={0.7}
        >
          <Icon
            name="income"
            size={15}
            color={value === TransactionType.INCOME ? colors.ok : colors.muted}
            strokeWidth={2.3}
          />
          <Text style={[styles.typeTabText, { color: value === TransactionType.INCOME ? colors.ok : colors.muted }]}>
            Income
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeTab, value === TransactionType.EXPENSE && styles.typeTabActive]}
          onPress={() => {
            onChange(TransactionType.EXPENSE);
            onTypeChange();
          }}
          activeOpacity={0.7}
        >
          <Icon
            name="expense"
            size={15}
            color={value === TransactionType.EXPENSE ? colors.danger : colors.muted}
            strokeWidth={2.3}
          />
          <Text
            style={[styles.typeTabText, { color: value === TransactionType.EXPENSE ? colors.danger : colors.muted }]}
          >
            Expense
          </Text>
        </TouchableOpacity>
      </View>
    )}
  />
);

export default TypeToggle;
