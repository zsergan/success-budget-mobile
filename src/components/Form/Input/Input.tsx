import type { TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Text, TextInput, View, TouchableOpacity } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import { palette } from '@shared/theme';

import styles from './style';

export interface InputProps extends TextInputProps {
  label?: string;
  iconLeft?: 'email' | 'lock';
  iconRight?: 'eye' | 'eye-off';
  onIconRightPress?: () => void;
  withShadow?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input = ({ label, iconLeft, iconRight, onIconRightPress, withShadow, containerStyle, ...props }: InputProps) => (
  <View style={[styles.root, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}

    <View>
      {iconLeft && (
        <View style={[styles.icon, styles.iconLeft]}>
          <MaterialIcons name={iconLeft} size={32} color={palette.greyDark} />
        </View>
      )}

      <TextInput
        {...props}
        style={[
          styles.input,
          iconLeft && styles.inputWithLeftIcon,
          iconRight && styles.inputWithRightIcon,
          withShadow && styles.inputWithShadow,
        ]}
      />

      {iconRight && (
        <View style={[styles.icon, styles.iconRight]}>
          <TouchableOpacity onPress={onIconRightPress}>
            <MaterialCommunityIcons name={iconRight} size={32} color={palette.black} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);

export default Input;
