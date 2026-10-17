import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import createStyles from './style';

import { useThemedStyles } from '@hooks';

const SHIMMER_ROWS: { category: DimensionValue; meta: DimensionValue }[] = [
  { category: '58%', meta: '38%' },
  { category: '44%', meta: '30%' },
  { category: '62%', meta: '34%' },
];

interface ShimmerBlockProps {
  style: StyleProp<ViewStyle>;
}

const ShimmerBlock = ({ style }: ShimmerBlockProps) => {
  const styles = useThemedStyles(createStyles);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, style, animatedStyle]} />;
};

const ShimmerGroup = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <ShimmerBlock style={styles.groupLabel} />
        <ShimmerBlock style={styles.groupTotal} />
      </View>

      {SHIMMER_ROWS.map((row) => (
        <View key={`${row.category}-${row.meta}`} style={styles.row}>
          <ShimmerBlock style={styles.iconBox} />

          <View style={styles.textColumn}>
            <ShimmerBlock style={[styles.textLine, { width: row.category }]} />
            <ShimmerBlock style={[styles.textLineSmall, { width: row.meta }]} />
          </View>

          <ShimmerBlock style={styles.amount} />
        </View>
      ))}
    </View>
  );
};

const TransactionsSkeleton = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      <ShimmerGroup />
      <ShimmerGroup />
    </View>
  );
};

export default TransactionsSkeleton;
