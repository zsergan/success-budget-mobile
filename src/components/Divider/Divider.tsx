import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  style?: StyleProp<ViewStyle>;
}

const Divider = ({ style }: Props) => {
  const styles = useThemedStyles(createStyles);

  return <View style={[styles.root, style]} />;
};

export default Divider;
