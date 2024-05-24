import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import styles from './style';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const Card = ({ children, style }: Props) => {
  return <View style={[styles.root, style]}>{children}</View>;
};

export default Card;
