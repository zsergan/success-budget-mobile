import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';

import styles from './style';

interface Props {
  title?: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  onPress: () => void;
  withShadow?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button = ({ title, icon, variant = 'primary', onPress, withShadow, disabled, style }: Props) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.button,
      styles[`${variant}Button`],
      withShadow && styles.withShadow,
      disabled && styles.disabled,
      style,
    ]}
    disabled={disabled}
    activeOpacity={0.5}
  >
    {icon && icon}

    {title && <Text style={[styles.buttonText, styles[`${variant}ButtonText`]]}>{title}</Text>}
  </TouchableOpacity>
);

export default Button;
