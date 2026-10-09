import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@shared/theme';

import styles from './style';

export type ListLoad = 'loading' | 'failed' | 'ready';

// A list the form picks from is ready only with data for its current space; a failed first load is not an empty one.
export const listLoad = ({ currentData, isError }: { currentData?: unknown; isError: boolean }): ListLoad =>
  currentData !== undefined ? 'ready' : isError ? 'failed' : 'loading';

interface Props {
  load: Exclude<ListLoad, 'ready'>;
  // What did not load, e.g. "categories".
  name: string;
  onRetry: () => void;
}

const SectionLoad = ({ load, name, onRetry }: Props) => (
  <View style={styles.root}>
    {load === 'loading' ? (
      <ActivityIndicator size="small" color={colors.muted} accessibilityLabel={`Loading ${name}`} />
    ) : (
      <>
        <Text style={styles.text}>Couldn’t load {name}</Text>

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
      </>
    )}
  </View>
);

export default SectionLoad;
