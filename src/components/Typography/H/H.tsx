import type { StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native';

import styles from './style';

interface Props {
  children: string;
  style?: StyleProp<ViewStyle>;
}

const H = ({ children, style }: Props) => <Text style={[styles.h, style]}>{children}</Text>;

export default H;
