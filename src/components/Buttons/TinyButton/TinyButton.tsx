import { TouchableOpacity } from 'react-native';

import type { ChipProps } from '../../Chip/Chip';
import Chip from '../../Chip/Chip';

interface Props extends ChipProps {
  onPress?: () => void;
}

const TinyButton = ({ onPress, ...props }: Props) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
    <Chip {...props} />
  </TouchableOpacity>
);

export default TinyButton;
