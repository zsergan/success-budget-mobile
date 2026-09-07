import { View } from 'react-native';

import type { IconType } from '@shared/types';
import { colors } from '@shared/theme';
import Icon from '../Icon/Icon';

import styles from './style';

const iconSize = {
  xs: 14,
  sm: 17,
  md: 20,
  lg: 23,
  xl: 26,
};

interface Props {
  icon?: IconType;
  color?: string;
  circleColor?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
    {icon && <Icon name={icon} size={iconSize[size]} color={color} />}
  </View>
);

export default CircleIcon;
