import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native';

import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  children: string;
  style?: StyleProp<ViewStyle>;
}

const H = ({ children, style }: Props) => {
  const styles = useThemedStyles(createStyles);

  return <Text style={[styles.h, style]}>{children}</Text>;
};

export default H;
