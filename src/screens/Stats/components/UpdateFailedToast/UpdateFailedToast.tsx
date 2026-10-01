import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { colors } from '@shared/theme';

import styles from './style';

interface Props {
  onRetry: () => void;
}

// Stays until a retry or a later refresh succeeds, unlike the app's self-dismissing alerts.
const UpdateFailedToast = ({ onRetry }: Props) => (
  <View style={styles.root} accessibilityRole="alert" accessibilityLiveRegion="polite" testID="stats-update-failed">
    <View style={styles.icon}>
      <Icon name="close" size={16} color={colors.danger} strokeWidth={2.3} />
    </View>

    <Text style={styles.text}>Couldn’t update</Text>

    <TouchableOpacity
      style={styles.retry}
      onPress={onRetry}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel="Retry the update"
    >
      <Text style={styles.retryText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

export default UpdateFailedToast;
