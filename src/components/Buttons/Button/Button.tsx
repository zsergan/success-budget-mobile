import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';

import styles from './style';

interface Props {
  title?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  onPress: () => void;
  withShadow?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button = ({ title, icon, variant = 'primary', onPress, withShadow, disabled, style }: Props) => {
  const isPrimaryDisabled = disabled && variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        styles[`${variant}Button`],
        withShadow && styles.withShadow,
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
