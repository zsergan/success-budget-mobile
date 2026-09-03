import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Text, TextInput, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import styles from './style';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  iconLeft?: IconType;
  iconRight?: IconType;
  onIconRightPress?: () => void;
  withShadow?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input = ({
  label,
  error,
  iconLeft,
  iconRight,
  onIconRightPress,
  withShadow,
  containerStyle,
  ...props
}: InputProps) => (
  <View style={[styles.root, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}

    <View>
      {iconLeft && (
        <View style={[styles.icon, styles.iconLeft]}>
          <MaterialIcons name={iconLeft} size={32} color={colors.muted} />
        </View>
      )}

      <TextInput
        {...props}
        style={[
          styles.input,
          !!error && styles.withError,
          iconLeft && styles.inputWithLeftIcon,
          iconRight && styles.inputWithRightIcon,
          withShadow && styles.inputWithShadow,
        ]}
      />

      {(iconRight || error) && (
        <View style={[styles.icon, styles.iconRight]}>
          <TouchableOpacity onPress={onIconRightPress}>
            <MaterialIcons
              name={iconRight ? iconRight : 'error'}
              size={32}
              color={error && !iconRight ? colors.danger : colors.text}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>

    {error && <Text style={styles.error}>{error}</Text>}
  </View>
);

export default Input;
