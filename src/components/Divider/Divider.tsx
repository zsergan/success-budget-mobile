import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import styles from './style';

interface Props {
  style?: StyleProp<ViewStyle>;
}

const Divider = ({ style }: Props) => <View style={[styles.root, style]} />;

export default Divider;
