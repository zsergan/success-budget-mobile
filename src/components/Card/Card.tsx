import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import styles from './style';

interface Props {
  children: ReactNode;
  customStyle?: StyleProp<ViewStyle>;
}

const Card = ({ children, customStyle }: Props) => {
  return <View style={[styles.root, customStyle]}>{children}</View>;
};

export default Card;
