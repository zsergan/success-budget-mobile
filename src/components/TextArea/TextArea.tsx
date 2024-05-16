import { TextInput } from 'react-native';

import styles from './style';

interface Props {
  value?: string;
  onChangeText?: (text: string) => void;
}

const TextArea = ({ value, onChangeText }: Props) => {
  return (
    <TextInput multiline value={value} onChangeText={onChangeText} placeholder="Your notes" style={styles.input} />
  );
};

export default TextArea;
