import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import useReduceMotion from '@screens/Launch/hooks/useReduceMotion';

import styles, { SEGMENT_WIDTH, TRACK_WIDTH } from './style';

const CROSSING_MS = 1600;
const PULSE_MS = 800;

// Indeterminate: a third of the track crosses it and re-enters from the left; with reduced motion it stays centred
// and fades between 40% and 100% opacity.
const LaunchIndicator = () => {
  const isReduced = useReduceMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = isReduced
      ? // The pulse is the reduced motion itself, so Reanimated must not cut it short under the system setting.
        withRepeat(
          withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.Never }),
          -1,
          true,
          undefined,
          ReduceMotion.Never,
        )
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
    // The status beside it says what is happening; the motion itself is not announced.
    <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.segment, segmentStyle]} />
    </View>
  );
};

export default LaunchIndicator;
