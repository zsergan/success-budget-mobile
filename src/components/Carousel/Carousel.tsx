import type { ReactNode } from 'react';
import { Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import theme, { colors } from '@shared/theme';

import styles from './style';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// How much of the neighbouring card peeks in on each side of the centered,
// focused card — keeping this fixed (rather than a scale transform on the
// items) is what makes every card end up the same size and lets the active
// one sit exactly centered, regardless of item count.
const PEEK = 32;
const GAP = 14;

interface Props<T> {
  items: T[];
  renderItem: (item: T, itemWidth: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  onIndexChange?: (index: number) => void;
}

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
  snapInterval: number;
}

const Dot = ({ index, scrollX, snapInterval }: DotProps) => {
  const style = useAnimatedStyle(() => {
    const position = scrollX.value / snapInterval;

    return {
      width: interpolate(position, [index - 1, index, index + 1], [5, 18, 5], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(
        position,
        [index - 1, index, index + 1],
        [colors.track, colors.accent, colors.track],
      ),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
};

const Carousel = <T,>({ items, renderItem, keyExtractor, onIndexChange }: Props<T>) => {
  const { width: screenWidth } = Dimensions.get('window');
  const contentWidth = screenWidth - 2 * theme.spacing.xl;
  const itemWidth = contentWidth - 2 * PEEK;
  const snapInterval = itemWidth + GAP;
  const maxScroll = (items.length - 1) * snapInterval;

  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  useAnimatedReaction(
    () => Math.round(scrollX.value / snapInterval),
    (current, previous) => {
      if (current !== previous && onIndexChange) {
        runOnJS(onIndexChange)(current);
      }
    },
  );

  const leftFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [0, PEEK], [0, 1], Extrapolation.CLAMP),
  }));

  const rightFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [maxScroll - PEEK, maxScroll], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <View>
      <View style={styles.scrollWrap}>
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={snapInterval}
          disableIntervalMomentum
          contentContainerStyle={{ paddingHorizontal: theme.spacing.xl + PEEK, columnGap: GAP }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {items.map((item, index) => (
            <View key={keyExtractor(item, index)}>{renderItem(item, itemWidth)}</View>
          ))}
        </Animated.ScrollView>

        <AnimatedLinearGradient
          style={[styles.fadeLeft, { width: PEEK }, leftFadeStyle]}
          colors={[colors.bg, `${colors.bg}00`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />

        <AnimatedLinearGradient
          style={[styles.fadeRight, { width: PEEK }, rightFadeStyle]}
          colors={[`${colors.bg}00`, colors.bg]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          pointerEvents="none"
        />
      </View>

      <View style={styles.dots}>
        {items.map((item, index) => (
          <Dot key={keyExtractor(item, index)} index={index} scrollX={scrollX} snapInterval={snapInterval} />
        ))}
      </View>
    </View>
  );
};

export default Carousel;
