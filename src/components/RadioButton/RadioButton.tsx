import { TouchableOpacity } from 'react-native';

import type { ChipProps } from '../Chip/Chip';
import Chip from '../Chip/Chip';

import styles from './style';

export interface RadioButtonProps<T> extends ChipProps {
  value: T;
  selected: boolean;
  onPress: (value: T) => void;
}

const RadioButton = <T extends number | string>({ selected, value, onPress, style, ...props }: RadioButtonProps<T>) => (
  <TouchableOpacity onPress={() => onPress(value)} activeOpacity={0.5}>
    <Chip {...props} style={[selected && styles.selected, style]} />
  </TouchableOpacity>
);

export default RadioButton;
