import type { StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import { Icon } from '@components';
import { useTheme, useThemedStyles } from '@hooks';

import createStyles from './style';

interface Props {
  title: string;
  onRetry: () => void;
  // The block's own height, so failing never moves its neighbours.
  style?: StyleProp<ViewStyle>;
}

const BlockError = ({ title, onRetry, style }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, style]} accessibilityRole="alert">
      <View style={styles.icon}>
        <Icon name="alert" size={19} color={colors.danger} strokeWidth={2} />
      </View>

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        activeOpacity={0.7}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Retry: ${title}`}
      >
        <Icon name="refresh" size={13} color={colors.text} strokeWidth={2.2} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BlockError;
