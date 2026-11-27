import { NO_KEYBOARD_TOOLBAR } from '@components/Form/KeyboardDoneButton/KeyboardDoneButton';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, useWindowDimensions, View } from 'react-native';

import createStyles, { amountFontSize, amountInputHeight, signSlotWidth } from './style';
import { currencySymbol } from '@shared/utils/currency';
import { groupAmountInput, sanitizeAmountInput } from '@shared/utils/amountInput';

interface Props {
  value: string;
  onChange: (value: string) => void;
  autoFocus: boolean;
  typeColor: string;
  isIncome: boolean;
  currencyCode?: string;
  // Why a typed or pasted value is not an amount; empty input is not an error here.
  error?: string;
  // The screen shows its Done above the number pad while the amount has focus.
  onFocusChange?: (isFocused: boolean) => void;
}

// Only digits and one decimal point get in, and the thousands show apart as they are typed; the draft keeps the
// plain amount. The sign comes from the type.
const AmountField = ({
  value,
  onChange,
  autoFocus,
  typeColor,
  isIncome,
  currencyCode,
  error,
  onFocusChange,
}: Props) => {
  const { scheme, colorTheme } = useTheme();
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setFocused] = useState(false);
  const { fontScale } = useWindowDimensions();

  // Focused once, on the open of a new transaction; never on Edit or on the way back from a picker.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const hasValue = value.trim() !== '';
  const shown = groupAmountInput(value.trim());
  const fontSize = amountFontSize(shown);
  const lineColor = error ? colors.danger : isFocused ? typeColor : colors.hairline;

  return (
    <View style={styles.root}>
      <Text style={styles.label}>Amount</Text>

      <View style={[styles.row, { borderBottomColor: lineColor }, (isFocused || !!error) && styles.rowActive]}>
        <View
          testID="amount-sign-slot"
          style={{ width: signSlotWidth(fontScale) }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={[styles.sign, { color: typeColor, fontSize, opacity: hasValue ? 1 : 0 }]}>
            {isIncome ? '+' : '−'}
          </Text>
        </View>

        <TextInput
          keyboardAppearance={scheme}
          ref={inputRef}
          value={shown}
          onChangeText={(text) => onChange(sanitizeAmountInput(text))}
          onFocus={() => {
            setFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setFocused(false);
            onFocusChange?.(false);
          }}
          placeholder="0"
          placeholderTextColor={colors.muted}
          inputMode="decimal"
          style={[styles.input, { color: typeColor, fontSize, height: amountInputHeight(fontScale) }]}
          selectionColor={typeColor}
          returnKeyType="done"
          inputAccessoryViewID={NO_KEYBOARD_TOOLBAR}
          accessibilityLabel="Amount"
        />

        {currencyCode && <Text style={styles.currency}>{currencySymbol(currencyCode)}</Text>}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

export default AmountField;
