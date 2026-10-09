import { Text, TouchableOpacity, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@components/Icon/Icon';
import theme, { colors } from '@shared/theme';

import styles from './style';

interface Props {
  onClose: () => void;
}

const RecordGone = ({ onClose }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: theme.spacing.xl + insets.bottom }]}>
      <BottomSheetScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <View style={styles.iconBox}>
          <Icon name="trash" size={26} color={colors.muted} strokeWidth={1.8} />
        </View>

        <Text style={styles.title}>This transaction no longer exists</Text>
        <Text style={styles.text}>It was deleted on another device or by another member of this space.</Text>
      </BottomSheetScrollView>

      <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RecordGone;
