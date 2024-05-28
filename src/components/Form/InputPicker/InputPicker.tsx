import { useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity, TouchableWithoutFeedback, View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import ModalContainer from '../../Modals/ModalContainer/ModalContainer';

import styles from './style';

interface Props {
  items: { label: string; value: number | string }[];
  selectedValue: number | string;
  onValueChange: (itemValue: number | string, itemIndex: number) => void;
  label?: string;
  disabled?: boolean;
  withShadow?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const InputPicker = ({ items, selectedValue, onValueChange, label, disabled, withShadow, containerStyle }: Props) => {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const selectedLabel = items.find((item) => item.value === Number(selectedValue))?.label || '';

  return (
    <>
      <ModalContainer isVisible={isPickerVisible} animationType="fade" onClose={() => setIsPickerVisible(false)}>
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

      <View style={[styles.root, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}

        <TouchableOpacity
          style={[styles.inputContainer, withShadow && styles.inputWithShadow]}
          onPress={() => setIsPickerVisible(true)}
          activeOpacity={0.5}
          disabled={disabled}
        >
          <Text style={styles.input}>{selectedLabel}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default InputPicker;
