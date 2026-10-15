import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

import { colors } from '@shared/theme';

import styles from './style';

type Variant = 'primary' | 'secondary' | 'outline' | 'tertiary' | 'danger';

const SPINNER_COLORS: Record<Variant, string> = {
  primary: colors.onAccent,
  secondary: colors.onSecondary,
  outline: colors.text,
  tertiary: colors.text,
  danger: '#FFFDFA',
};

interface Props {
  title?: string;
  icon?: ReactNode;
  variant?: Variant;
  // 'lg' is the auth screens' button: taller, rounder and bold.
  size?: 'md' | 'lg';
  onPress: () => void;
  withShadow?: boolean;
  disabled?: boolean;
  // Keeps the button's colours and shows a spinner in place of its content; presses are ignored meanwhile.
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button = ({
  title,
  icon,
  variant = 'primary',
  size = 'md',
  onPress,
  withShadow,
  disabled,
  isLoading = false,
  style,
}: Props) => {
  const isPrimaryDisabled = disabled && variant === 'primary';
  const isLarge = size === 'lg';
  // A large primary button glows in its own colour instead of the card shadow, and only while it can be pressed.
  const largePrimaryShadow = isPrimaryDisabled ? undefined : styles.accentGlow;
  const shadowStyle = isLarge && variant === 'primary' ? largePrimaryShadow : styles.withShadow;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        styles[`${variant}Button`],
        isLarge && styles.largeButton,
        withShadow && shadowStyle,
        disabled && (isPrimaryDisabled ? styles.primaryButtonDisabled : styles.disabled),
        style,
      ]}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      // The spinner replaces the title, so the title names the button meanwhile.
      accessibilityLabel={isLoading ? title : undefined}
      accessibilityState={{ disabled: !!disabled || isLoading, busy: isLoading }}
    >
      {isLoading && <ActivityIndicator color={SPINNER_COLORS[variant]} />}

      {!isLoading && icon}

      {!isLoading && title && (
        <Text
          style={[
            styles.buttonText,
            styles[`${variant}ButtonText`],
            isLarge && styles.largeButtonText,
            isPrimaryDisabled && styles.primaryButtonTextDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
