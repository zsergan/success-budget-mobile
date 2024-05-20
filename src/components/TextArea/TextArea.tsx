import { TextInput } from 'react-native';

import styles from './style';

interface Props {
  value?: string;
  onChangeText?: (text: string) => void;
  blurOnSubmit?: boolean;
  maxLength?: number;
}

const TextArea = ({ value, onChangeText, blurOnSubmit, maxLength }: Props) => {
  return (
    <TextInput
      multiline
      value={value}
      onChangeText={onChangeText}
      placeholder="Your notes"
      returnKeyType={blurOnSubmit ? 'done' : 'next'}
      style={styles.input}
      blurOnSubmit={blurOnSubmit}
      maxLength={maxLength}
    />
  );
};

export default TextArea;
