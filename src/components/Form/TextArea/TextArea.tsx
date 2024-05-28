import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';

import styles from './style';

interface Props extends TextInputProps {
  minHeight?: number;
}

const TextArea = ({ blurOnSubmit, minHeight, ...props }: Props) => (
  <TextInput
    multiline
    style={[styles.input, minHeight ? { minHeight } : {}]}
    returnKeyType={blurOnSubmit ? 'done' : 'next'}
    blurOnSubmit={blurOnSubmit}
    {...props}
  />
);

export default TextArea;
