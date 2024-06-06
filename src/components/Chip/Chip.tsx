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
  circleColor?: string;
  showCircle?: boolean;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const Chip = ({ size = 'sm', title, icon, color, circleColor, showCircle, disabled, selected, style }: ChipProps) => (
  <View style={[styles.chip, selected && styles.selected, disabled && styles.disabled, style]}>
    {(icon || showCircle) && <CircleIcon icon={icon} color={color} circleColor={circleColor} size={size} />}

    {title && (
      <Text style={[styles.title, styles[`${size}Title`]]} numberOfLines={1}>
        {title}
      </Text>
    )}
  </View>
);

export default Chip;
