import type { RefObject } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { hexToRgba } from '@shared/utils';
import type { TransactionFormData } from '../useTransactionForm';

import styles from './style';

interface Props {
  control: Control<TransactionFormData>;
  amountRef: RefObject<TextInput | null>;
  typeColor: string;
  isIncome: boolean;
  currencyCode?: string;
  selectedWalletName?: string;
}

const AmountField = ({ control, amountRef, typeColor, isIncome, currencyCode, selectedWalletName }: Props) => (
  <View style={[styles.hero, { backgroundColor: hexToRgba(typeColor, 0.07) }]}>
    <Text style={[styles.heroLabel, { color: typeColor }]}>{isIncome ? 'Income amount' : 'Expense amount'}</Text>

    <View style={styles.heroRow}>
      <Controller
        name="amount"
        control={control}
        render={({ field: { onChange, value } }) => (
          <TextInput
            ref={amountRef}
            value={value}
            onChangeText={onChange}
            placeholder="0"
            placeholderTextColor={hexToRgba(typeColor, 0.4)}
            inputMode="decimal"
            style={[styles.heroAmount, { color: typeColor }]}
            returnKeyType="done"
          />
        )}
      />

      {selectedWalletName && <Text style={[styles.heroCurrency, { color: typeColor }]}>{currencyCode}</Text>}
    </View>

    {selectedWalletName && (
      <Text style={styles.heroSub}>
        {currencyCode} · {isIncome ? 'added to' : 'taken from'} {selectedWalletName}
      </Text>
    )}
  </View>
);

export default AmountField;
