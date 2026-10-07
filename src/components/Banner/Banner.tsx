import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';

import styles from './style';

interface Props {
  tone: 'warn' | 'danger';
  title?: string;
  text: string;
  actionLabel: string;
  isBusy?: boolean;
  onAction: () => void;
}

// An inline message with the one step that resolves it.
const Banner = ({ tone, title, text, actionLabel, isBusy = false, onAction }: Props) => {
  const color = tone === 'warn' ? colors.warn : colors.danger;

  return (
    <View style={[styles.root, { backgroundColor: hexToRgba(color, 0.12) }]} accessibilityRole="alert">
      <Icon name="alert" size={16} color={color} strokeWidth={2} />

      <View style={styles.textColumn}>
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={styles.text}>{text}</Text>
      </View>

      <TouchableOpacity
        style={styles.action}
        onPress={onAction}
        disabled={isBusy}
        activeOpacity={0.7}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ busy: isBusy }}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Text style={styles.actionText}>{actionLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default Banner;
