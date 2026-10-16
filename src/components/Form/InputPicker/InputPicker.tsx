import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, Keyboard, TouchableOpacity, TouchableWithoutFeedback, View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Icon from '@components/Icon/Icon';
import ModalContainer from '@components/Modals/ModalContainer/ModalContainer';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { IconType } from '@shared/types';

import OutlinedField from '../OutlinedField/OutlinedField';
import createOutlinedStyles from '../OutlinedField/style';
import createStyles from './style';

// The native list shows its first row as chosen when the value matches none, so an empty value gets its own row.
// Its value is one no item is expected to use, so a real empty-string value is never taken for it.
const EMPTY_VALUE = '__input-picker-empty__';

interface Props {
  items: { label: string; value: number | string }[];
  selectedValue: number | string | undefined;
  // Undefined for the empty row, which the list offers when there is a placeholder.
  onValueChange: (itemValue: number | string | undefined, itemIndex: number) => void;
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
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);
  const outlinedStyles = useThemedStyles(createOutlinedStyles);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === selectedValue);
  const shownText = selectedItem ? selectedItem.label : placeholder;
  const hasEmptyRow = placeholder !== undefined;
  const pickerValue = hasEmptyRow && !selectedItem ? EMPTY_VALUE : selectedValue;

  const changeValue = (value: number | string, index: number) => {
    if (!hasEmptyRow) return onValueChange(value, index);

    onValueChange(value === EMPTY_VALUE ? undefined : value, index - 1);
  };

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
              <Picker selectedValue={pickerValue} onValueChange={changeValue} itemStyle={styles.pickerItem}>
                {hasEmptyRow && <Picker.Item label={placeholder} value={EMPTY_VALUE} color={colors.placeholder} />}

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
          valueText={shownText}
          isBusy={isLoading}
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
            style={[outlinedStyles.value, styles.outlinedValue, !selectedItem && outlinedStyles.placeholder]}
            numberOfLines={1}
          >
            {shownText}
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
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityValue={shownText ? { text: shownText } : undefined}
            accessibilityState={{ disabled: !!disabled, expanded: isPickerVisible }}
          >
            <Text style={[styles.input, !selectedItem && styles.placeholder]} numberOfLines={1}>
              {shownText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default InputPicker;
