import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import styles from './style';

interface Props {
  height: number;
  style?: StyleProp<ViewStyle>;
}

// Holds a block's place in the list until its own component replaces it.
const BlockPlaceholder = ({ height, style }: Props) => <View style={[styles.block, { height }, style]} />;

export default BlockPlaceholder;
