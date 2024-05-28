import type { StyleProp, ViewStyle } from 'react-native';
import { Text, View } from 'react-native';

import type { IconType } from '@shared/types';
import CircleIcon from '../CircleIcon/CircleIcon';

import styles from './style';

export interface ChipProps {
  title?: string;
  icon?: IconType;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

const Chip = ({ title, icon, color, style }: ChipProps) => (
  <View style={[styles.chip, style]}>
    {icon && <CircleIcon icon={icon} color={color} />}

    {title && <Text style={styles.title}>{title}</Text>}
  </View>
);

export default Chip;
