import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';

import styles from './style';

interface Props {
  title?: string;
  icon?: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button = ({ title, icon, onPress, disabled, style }: Props) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, disabled && styles.disabled, style]} disabled={disabled}>
    {icon && icon}
    {title && <Text style={styles.buttonText}>{title}</Text>}
  </TouchableOpacity>
);

export default Button;
