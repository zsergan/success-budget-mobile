import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { ComponentRef } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import createStyles, { AMOUNT_FONT } from './style';

// The digits shrink from 40 to 28 pt as they grow, so the largest amount still fits on one line.
const fontSizeFor = (value: string) =>
  Math.max(AMOUNT_FONT.min, Math.min(AMOUNT_FONT.max, AMOUNT_FONT.max - (value.length - 8) * 2));

interface Props {
  value: string;
  onChange: (value: string) => void;
  autoFocus: boolean;
  typeColor: string;
  isIncome: boolean;
  currencyCode?: string;
  // Why a typed or pasted value is not an amount; empty input is not an error here.
  error?: string;
}

// The typed text stays exactly as entered, so the caret never jumps and nothing is cut; the sign comes from the type.
const AmountField = ({ value, onChange, autoFocus, typeColor, isIncome, currencyCode, error }: Props) => {
  const { scheme, colorTheme } = useTheme();
  const { colors } = colorTheme;
  const styles = useThemedStyles(createStyles);
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null);
  const [isFocused, setFocused] = useState(false);

  // Focused once, on the open of a new transaction; never on Edit or on the way back from a panel.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const hasValue = value.trim() !== '';
  const fontSize = fontSizeFor(value);
  const lineColor = error ? colors.danger : isFocused ? typeColor : colors.hairline;

  return (
    <View style={styles.root}>
      <View style={[styles.row, { borderBottomColor: lineColor }, (isFocused || !!error) && styles.rowActive]}>
        {hasValue && (
          <Text style={[styles.sign, { color: typeColor, fontSize }]} accessibilityElementsHidden>
            {isIncome ? '+' : '−'}
          </Text>
        )}

        <BottomSheetTextInput
          keyboardAppearance={scheme}
          ref={inputRef}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="0"
          placeholderTextColor={colors.muted}
          inputMode="decimal"
          style={[styles.input, { color: typeColor, fontSize }]}
          selectionColor={typeColor}
          returnKeyType="done"
          accessibilityLabel="Amount"
        />

        <Text style={styles.currency}>{currencyCode}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

export default AmountField;
