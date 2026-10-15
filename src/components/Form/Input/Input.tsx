import { useState } from 'react';
import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Text, TextInput, View, TouchableOpacity } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import OutlinedField from '../OutlinedField/OutlinedField';
import outlinedStyles from '../OutlinedField/style';
import styles from './style';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  iconLeft?: IconType;
  iconRight?: IconType;
  onIconRightPress?: () => void;
  iconRightAccessibilityLabel?: string;
  withShadow?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  // 'outlined' is the labelled, hairline-bordered field; it shows the hint and the valid mark, 'filled' does not.
  variant?: 'filled' | 'outlined';
  hint?: string;
  isValid?: boolean;
}

const Input = ({
  label,
  error,
  iconLeft,
  iconRight,
  onIconRightPress,
  iconRightAccessibilityLabel,
  withShadow,
  containerStyle,
  variant = 'filled',
  hint,
  isValid,
  onFocus,
  onBlur,
  editable = true,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  if (variant === 'outlined') {
    return (
      <OutlinedField
        label={label}
        error={error}
        hint={hint}
        iconLeft={iconLeft}
        isFocused={isFocused}
        isValid={isValid}
        disabled={!editable}
        containerStyle={containerStyle}
        trailing={
          iconRight && (
            <TouchableOpacity
              onPress={onIconRightPress}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={iconRightAccessibilityLabel}
            >
              <Icon name={iconRight} size={19} color={colors.muted} strokeWidth={1.9} />
            </TouchableOpacity>
          )
        }
      >
        <TextInput
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={label}
          {...props}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[outlinedStyles.value, styles.outlinedInput, !editable && styles.disabledInput]}
        />
      </OutlinedField>
    );
  }

  return (
    <View style={[styles.root, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View>
        {iconLeft && (
          <View style={[styles.icon, styles.iconLeft]}>
            <Icon name={iconLeft} size={32} color={colors.muted} />
          </View>
        )}

        <TextInput
          placeholderTextColor={colors.muted}
          {...props}
          editable={editable}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            isFocused && !error && styles.focused,
            !!error && styles.withError,
            iconLeft && styles.inputWithLeftIcon,
            iconRight && styles.inputWithRightIcon,
            withShadow && styles.inputWithShadow,
            !editable && styles.disabledInput,
          ]}
        />

        {(iconRight || error) && (
          <View style={[styles.icon, styles.iconRight]}>
            <TouchableOpacity onPress={onIconRightPress} accessibilityLabel={iconRightAccessibilityLabel}>
              <Icon
                name={iconRight ? iconRight : 'alert'}
                size={32}
                color={error && !iconRight ? colors.danger : colors.text}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

export default Input;
