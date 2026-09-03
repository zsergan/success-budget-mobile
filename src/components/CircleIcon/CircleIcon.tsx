import { View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import type { IconType } from '@shared/types';
import { colors } from '@shared/theme';

import styles from './style';

const iconSize = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 36,
};

interface Props {
  icon?: IconType;
  color?: string;
  circleColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  border?: boolean;
}

const CircleIcon = ({
  icon,
  color = colors.text,
  circleColor = colors.elevated,
  size = 'sm',
  border = false,
}: Props) => (
  <View
    style={[
      styles.circle,
      styles[`${size}Circle`],
      border && styles.circleWithBorder,
      { backgroundColor: circleColor },
    ]}
  >
    {icon && <MaterialIcons style={styles.icon} name={icon} size={iconSize[size]} color={color} />}
  </View>
);

export default CircleIcon;
