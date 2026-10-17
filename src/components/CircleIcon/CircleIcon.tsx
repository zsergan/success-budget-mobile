import { View } from 'react-native';

import type { IconType } from '@shared/types';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import Icon from '../Icon/Icon';

import createStyles from './style';

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

const CircleIcon = ({ icon, color, circleColor, size = 'sm', border = false }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View
      style={[
        styles.circle,
        styles[`${size}Circle`],
        border && styles.circleWithBorder,
        { backgroundColor: circleColor ?? colors.elevated },
      ]}
    >
      {icon && <Icon name={icon} size={iconSize[size]} color={color ?? colors.text} />}
    </View>
  );
};

export default CircleIcon;
