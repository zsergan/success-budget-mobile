import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';

import styles from './style';

interface Props {
  title?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'tertiary' | 'danger';
  // 'lg' is the auth screens' button: taller, rounder and bold.
  size?: 'md' | 'lg';
  onPress: () => void;
  withShadow?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button = ({ title, icon, variant = 'primary', size = 'md', onPress, withShadow, disabled, style }: Props) => {
  const isPrimaryDisabled = disabled && variant === 'primary';
  const isLarge = size === 'lg';
  // A large primary button glows in its own colour instead of the card shadow.
  const shadowStyle = isLarge && variant === 'primary' ? styles.accentGlow : styles.withShadow;

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
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && icon}

      {title && (
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
