import type { StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import styles from './style';

interface Props {
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SwipeOptions = ({ onDelete, style }: Props) => {
  return (
    <View style={[styles.root, style]}>
      <TouchableOpacity style={styles.item} onPress={onDelete}>
        <FontAwesome5 name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default SwipeOptions;
