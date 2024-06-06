import type { GestureResponderEvent } from 'react-native';
import { TouchableOpacity } from 'react-native';

import type { ChipProps } from '../Chip/Chip';
import Chip from '../Chip/Chip';

export interface RadioButtonProps<T> extends ChipProps {
  value: T;
  selected: boolean;
  disabled?: boolean;
  onPress: (value: T) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
}

const RadioButton = <T extends number | string>({
  value,
  disabled,
  onPress,
  onLongPress,
  ...props
}: RadioButtonProps<T>) => (
  <TouchableOpacity disabled={disabled} onPress={() => onPress(value)} activeOpacity={0.5} onLongPress={onLongPress}>
    <Chip {...props} disabled={disabled} />
  </TouchableOpacity>
);

export default RadioButton;
