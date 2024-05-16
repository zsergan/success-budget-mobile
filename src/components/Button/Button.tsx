import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity } from 'react-native';

import styles from './style';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Button = ({ title, onPress, disabled, style }: Props) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, disabled && styles.disabled, style]} disabled={disabled}>
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

export default Button;
