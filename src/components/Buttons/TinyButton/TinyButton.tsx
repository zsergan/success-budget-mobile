import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity, Text, View } from 'react-native';

import type { IconType } from '@shared/types';
import { colors } from '@shared/theme';
import Icon from '@components/Icon/Icon';

import styles from './style';

const iconSize = {
  sm: 13,
  md: 14,
  lg: 16,
};

export interface TinyButtonProps {
  onPress?: () => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  /** 'filled' (default) is the track-colored chip; 'plain' is bare icon/text, no box — for link-style actions like "See all". */
  variant?: 'filled' | 'plain';
  title?: string;
  icon?: IconType;
  /** Set false to render the icon bare, without its circular background — for chips like "Add wallet" that show a plain icon. */
  iconWrap?: boolean;
  strokeWidth?: number;
  color?: string;
  circleColor?: string;
  showCircle?: boolean;
  selected?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TinyButton = ({
  onPress,
  onLongPress,
  size = 'sm',
  variant = 'filled',
  title,
  icon,
  iconWrap = true,
  strokeWidth,
  color,
  circleColor,
  showCircle,
  disabled,
  selected,
  style,
}: TinyButtonProps) => (
  <TouchableOpacity disabled={disabled} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.5}>
    <View
      style={[
        styles.button,
        variant === 'filled' && [styles.filledButton, styles[`${size}Button`]],
        variant === 'filled' && selected && styles.selected,
        disabled && styles.disabled,
        style,
      ]}
    >
      {(icon || showCircle) &&
        (iconWrap ? (
          <View style={[styles.circle, styles[`${size}Circle`], { backgroundColor: circleColor || colors.elevated }]}>
            {icon && <Icon name={icon} size={iconSize[size]} color={color} strokeWidth={strokeWidth} />}
          </View>
        ) : (
          icon && <Icon name={icon} size={iconSize[size]} color={color} strokeWidth={strokeWidth} />
        ))}

      {title && <Text style={[styles[`${size}Title`], variant === 'plain' && styles.plainTitle]}>{title}</Text>}
    </View>
  </TouchableOpacity>
);

export default TinyButton;
