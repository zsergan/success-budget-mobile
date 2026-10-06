import { useEffect, useRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { hexToRgba } from '@shared/utils';

import styles from './style';

interface Props {
  value: string;
  onChange: (value: string) => void;
  autoFocus: boolean;
  typeColor: string;
  isIncome: boolean;
  currencyCode?: string;
  walletName?: string;
}

const AmountField = ({ value, onChange, autoFocus, typeColor, isIncome, currencyCode, walletName }: Props) => {
  const inputRef = useRef<TextInput>(null);

  // Focused once, on the open of a new transaction; never on Edit or on the way back from a panel.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <View style={[styles.hero, { backgroundColor: hexToRgba(typeColor, 0.07) }]}>
      <Text style={[styles.heroLabel, { color: typeColor }]}>{isIncome ? 'Income amount' : 'Expense amount'}</Text>

      <View style={styles.heroRow}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={hexToRgba(typeColor, 0.4)}
          inputMode="decimal"
          style={[styles.heroAmount, { color: typeColor }]}
          returnKeyType="done"
          accessibilityLabel="Amount"
        />

        <Text style={[styles.heroCurrency, { color: typeColor }]}>{currencyCode}</Text>
      </View>

      <Text style={styles.heroSub}>
        {walletName ? `${currencyCode} · ${isIncome ? 'added to' : 'taken from'} ${walletName}` : currencyCode}
      </Text>
    </View>
  );
};

export default AmountField;
