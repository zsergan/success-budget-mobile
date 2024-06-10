import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity, Text, View } from 'react-native';

import type { IconType } from '@shared/types';
import CircleIcon from '../../CircleIcon/CircleIcon';

import styles from './style';

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
    <View style={[styles.button, selected && styles.selected, disabled && styles.disabled, style]}>
      {(icon || showCircle) && <CircleIcon icon={icon} color={color} circleColor={circleColor} size={size} />}

      {title && (
        <Text style={[styles.title, styles[`${size}Title`]]} numberOfLines={1}>
          {title}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

export default TinyButton;
