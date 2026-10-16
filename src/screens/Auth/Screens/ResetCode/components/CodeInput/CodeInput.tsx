import type { Ref } from 'react';
import { useState } from 'react';
import type { TextInput as TextInputType } from 'react-native';
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

export const CODE_LENGTH = 6;

// Six fixed boxes share the width: a digit grown further than this no longer fits its box.
const DIGIT_SCALE_LIMIT = 1.3;

interface Props {
  ref?: Ref<TextInputType>;
  value: string;
  onChangeText: (text: string) => void;
  onPaste: () => void;
  error?: string;
  hint?: string;
  // A request is running: the digits stay but can't change.
  isLocked?: boolean;
  // The code can no longer be used: the boxes empty out until a new code is sent.
  isDisabled?: boolean;
}

// One real field under six drawn boxes: the keypad, paste, long-press and one-time-code autofill all fill it at once.
const CodeInput = ({ ref, value, onChangeText, onPaste, error, hint, isLocked, isDisabled }: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const isEditable = !isLocked && !isDisabled;
  const activeIndex = isFocused && isEditable ? Math.min(value.length, CODE_LENGTH - 1) : -1;
  const message = error ?? hint;
  const shownValue = isDisabled ? '' : value;

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, !!error && styles.labelError]}>6-digit code</Text>

        <TouchableOpacity
          style={styles.paste}
          onPress={onPaste}
          disabled={!isEditable}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Paste code"
          accessibilityState={{ disabled: !isEditable }}
        >
          <Icon name="clipboard" size={14} color={isEditable ? colors.text : colors.muted} strokeWidth={2} />
          <View style={styles.pasteUnderline}>
            <Text style={[styles.pasteText, !isEditable && styles.mutedText]}>Paste</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.cells}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const digit = shownValue[index] ?? '';
          const isActive = index === activeIndex;

          return (
            <View
              key={index}
              testID="code-box"
              style={[
                styles.cell,
                digit !== '' && styles.cellFilled,
                isDisabled && styles.cellDisabled,
                isActive && styles.cellActive,
                isActive && !!error && styles.cellActiveError,
                !!error && styles.cellError,
              ]}
            >
              <Text maxFontSizeMultiplier={DIGIT_SCALE_LIMIT} style={[styles.digit, isLocked && styles.mutedText]}>
                {digit}
              </Text>
              {isActive && digit === '' && <View style={styles.caret} />}
            </View>
          );
        })}

        <TextInput
          ref={ref}
          style={styles.field}
          value={shownValue}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={isEditable}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
          caretHidden
          selectionColor="transparent"
          // A tap lands wherever it falls in the hidden text; typing and deleting always work at its end.
          selection={{ start: shownValue.length, end: shownValue.length }}
          accessibilityLabel="6-digit code"
          accessibilityHint={message}
          accessibilityValue={{ text: shownValue.split('').join(' ') }}
        />
      </View>

      <View style={styles.message} accessibilityLiveRegion="polite">
        {error ? (
          <>
            <View style={styles.errorIcon}>
              <Icon name="alert" size={13} color={colors.danger} strokeWidth={2.2} />
            </View>
            <Text style={styles.errorText}>{error}</Text>
          </>
        ) : (
          hint && <Text style={styles.hintText}>{hint}</Text>
        )}
      </View>
    </View>
  );
};

export default CodeInput;
