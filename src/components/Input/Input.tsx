import type { TextInputProps } from 'react-native';
import { Text, TextInput, View } from 'react-native';

import styles from './style';

interface Props extends TextInputProps {
  label?: string;
}

const Input = ({ label, ...props }: Props) => {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput {...props} style={styles.input} />
    </View>
  );
};

export default Input;
