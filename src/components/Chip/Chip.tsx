import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import type { IconType } from '@shared/types';
import CircleIcon from '../CircleIcon/CircleIcon';

import styles from './style';

export interface ChipProps {
  size?: 'sm' | 'md';
  title?: string;
  icon?: IconType;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const Chip = ({ size = 'sm', title, icon, color, style }: ChipProps) => (
  <View style={[styles.chip, style]}>
    {icon && <CircleIcon icon={icon} color={color} size={size} />}

    {title && <Text style={[styles.title, styles[`${size}Title`]]}>{title}</Text>}
  </View>
);

export default Chip;
