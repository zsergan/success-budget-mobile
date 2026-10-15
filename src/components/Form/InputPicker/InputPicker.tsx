import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Keyboard, TouchableOpacity, TouchableWithoutFeedback, View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Icon from '@components/Icon/Icon';
import ModalContainer from '@components/Modals/ModalContainer/ModalContainer';
import { colors } from '@shared/theme';
import type { IconType } from '@shared/types';

import OutlinedField from '../OutlinedField/OutlinedField';
import outlinedStyles from '../OutlinedField/style';
import styles from './style';

interface Props {
  items: { label: string; value: number | string }[];
  selectedValue: number | string;
  onValueChange: (itemValue: number | string, itemIndex: number) => void;
  // Called when the list closes, picked or not, the way a text field reports a blur.
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  withShadow?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  variant?: 'filled' | 'outlined';
  iconLeft?: IconType;
  hint?: string;
  error?: string;
  // Outlined only: the items are still on their way, so the field cannot open yet.
  isLoading?: boolean;
}

const InputPicker = ({
  items,
  selectedValue,
  onValueChange,
  onBlur,
  label,
  placeholder,
  disabled,
  withShadow,
  containerStyle,
  variant = 'filled',
  iconLeft,
  hint,
  error,
  isLoading = false,
}: Props) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const selectedLabel = items.find((item) => item.value === Number(selectedValue))?.label || '';

  const openPicker = () => {
    Keyboard.dismiss();
    setIsPickerVisible(true);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
    onBlur?.();
  };

  return (
    <>
      <ModalContainer isVisible={isPickerVisible} animationType="fade" onClose={closePicker}>
        <View style={styles.container}>
          <TouchableWithoutFeedback>
            <View style={styles.contentContainer}>
              <Picker selectedValue={selectedValue} onValueChange={onValueChange}>
                {items.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </ModalContainer>

      {variant === 'outlined' ? (
        <OutlinedField
          label={label}
          hint={hint}
          error={error}
          iconLeft={iconLeft}
          isFocused={isPickerVisible}
          disabled={disabled || isLoading}
          onPress={openPicker}
          containerStyle={containerStyle}
          trailing={
            isLoading ? (
              <ActivityIndicator size="small" color={colors.muted} />
            ) : (
              <Icon name="chevron-down" size={19} color={colors.muted} strokeWidth={1.9} />
            )
          }
        >
          <Text
            style={[outlinedStyles.value, styles.outlinedValue, !selectedLabel && outlinedStyles.placeholder]}
            numberOfLines={1}
          >
            {selectedLabel || placeholder}
          </Text>
        </OutlinedField>
      ) : (
        <View style={[styles.root, containerStyle]}>
          {label && <Text style={styles.label}>{label}</Text>}

          <TouchableOpacity
            style={[styles.inputContainer, withShadow && styles.inputWithShadow]}
            onPress={openPicker}
            activeOpacity={0.5}
            disabled={disabled}
          >
            <Text style={[styles.input, !selectedLabel && styles.placeholder]} numberOfLines={1}>
              {selectedLabel || placeholder}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default InputPicker;
