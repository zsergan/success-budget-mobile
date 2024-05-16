import { Text, TouchableOpacity } from 'react-native';

import styles from './style';

export interface RadioButtonProps {
  label: string;
  value: number;
  selected: boolean;
  onPress: (value: number) => void;
}

const RadioButton = ({ label, selected, value, onPress }: RadioButtonProps) => {
  const handlePress = () => onPress(value);

  return (
    <TouchableOpacity style={[styles.root, selected && styles.selected]} onPress={handlePress}>
      <Text style={styles.button}>{label}</Text>
    </TouchableOpacity>
  );
};

export default RadioButton;
