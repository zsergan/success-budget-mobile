import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity, Text, View } from 'react-native';

import type { IconType } from '@shared/types';
import { colors } from '@shared/theme';
import Icon from '../../Icon/Icon';

import styles from './style';

const iconSize = {
  sm: 13,
  md: 14,
};

export interface TinyButtonProps {
  onPress?: () => void;
  onLongPress?: (event: GestureResponderEvent) => void;
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

const TinyButton = ({
  onPress,
  onLongPress,
  size = 'sm',
  title,
  icon,
  color,
  circleColor,
  showCircle,
  disabled,
  selected,
  style,
}: TinyButtonProps) => (
  <TouchableOpacity disabled={disabled} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.5}>
    <View
      style={[styles.button, styles[`${size}Button`], selected && styles.selected, disabled && styles.disabled, style]}
    >
      {(icon || showCircle) && (
        <View style={[styles.circle, styles[`${size}Circle`], { backgroundColor: circleColor || colors.elevated }]}>
          {icon && <Icon name={icon} size={iconSize[size]} color={color} />}
        </View>
      )}

      {title && <Text style={styles[`${size}Title`]}>{title}</Text>}
    </View>
  </TouchableOpacity>
);

export default TinyButton;
