import type { TextInputProps } from 'react-native';
import { TextInput } from 'react-native';

import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props extends TextInputProps {
  minHeight?: number;
}

const TextArea = ({ blurOnSubmit, minHeight, ...props }: Props) => {
  const { scheme, colorTheme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <TextInput
      multiline
      style={[styles.input, minHeight ? { minHeight } : {}]}
      placeholderTextColor={colorTheme.colors.placeholder}
      keyboardAppearance={scheme}
      returnKeyType={blurOnSubmit ? 'done' : 'next'}
      blurOnSubmit={blurOnSubmit}
      {...props}
    />
  );
};

export default TextArea;
