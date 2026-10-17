import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import createStyles from './style';

import { useThemedStyles } from '@hooks';

interface Props {
  height?: number;
  style?: StyleProp<ViewStyle>;
}

// Holds a block's place in the list until its own component replaces it.
const BlockPlaceholder = ({ height, style }: Props) => {
  const styles = useThemedStyles(createStyles);

  return <View testID="block-placeholder" style={[styles.block, height !== undefined && { height }, style]} />;
};

export default BlockPlaceholder;
