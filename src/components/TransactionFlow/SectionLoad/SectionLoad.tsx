import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import Icon from '@components/Icon/Icon';
import useTheme from '@hooks/useTheme';
import useThemedStyles from '@hooks/useThemedStyles';
import type { IconType } from '@shared/types';

import createStyles from './style';

export type ListLoad = 'loading' | 'failed' | 'ready';

// A list the form picks from is ready only with data for its current space; a failed first load is not an empty one.
export const listLoad = ({ currentData, isError }: { currentData?: unknown; isError: boolean }): ListLoad =>
  currentData !== undefined ? 'ready' : isError ? 'failed' : 'loading';

interface Props {
  load: Exclude<ListLoad, 'ready'>;
  // What did not load, e.g. "categories".
  name: string;
  icon: IconType;
  onRetry: () => void;
}

const SectionLoad = ({ load, name, icon, onRetry }: Props) => {
  const { colors } = useTheme().colorTheme;
  const styles = useThemedStyles(createStyles);

  if (load === 'loading') {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator size="small" color={colors.muted} accessibilityLabel={`Loading ${name}`} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.iconBox}>
        <Icon name={icon} size={18} color={colors.muted} strokeWidth={1.8} />
      </View>

      <View style={styles.texts}>
        <Text style={styles.title}>{`${name[0].toUpperCase()}${name.slice(1)} didn’t load`}</Text>
        <Text style={styles.text}>Your entries are kept.</Text>
      </View>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        activeOpacity={0.7}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Retry loading ${name}`}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SectionLoad;
