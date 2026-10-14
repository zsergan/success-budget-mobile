import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import styles, { SEGMENT_WIDTH, TRACK_WIDTH } from './style';

const CROSSING_MS = 1600;
const PULSE_MS = 800;

// Indeterminate: a third of the track crosses it and re-enters from the left; with reduced motion it stays centred
// and fades between 40% and 100% opacity.
const LaunchIndicator = () => {
  const isReduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = isReduced
      ? withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease) }), -1, true)
      : withRepeat(withTiming(1, { duration: CROSSING_MS, easing: Easing.bezier(0.45, 0, 0.55, 1) }), -1, false);

    return () => cancelAnimation(progress);
  }, [isReduced, progress]);

  const segmentStyle = useAnimatedStyle(() =>
    isReduced
      ? {
          opacity: interpolate(progress.value, [0, 1], [0.4, 1]),
          transform: [{ translateX: (TRACK_WIDTH - SEGMENT_WIDTH) / 2 }],
        }
      : { transform: [{ translateX: interpolate(progress.value, [0, 1], [-SEGMENT_WIDTH, TRACK_WIDTH]) }] },
  );

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.segment, segmentStyle]} />
    </View>
  );
};

export default LaunchIndicator;
