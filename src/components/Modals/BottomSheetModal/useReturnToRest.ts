import { useCallback, useLayoutEffect, useRef } from 'react';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

// Calls `onRest` once a sheet sent back to its snap point after `watch()` gets there. Its position lives on the UI
// thread, and the library reports no end to a return that keeps the same index.
const useReturnToRest = (onRest: () => void) => {
  const animatedIndex = useSharedValue(-1);
  const isWatching = useSharedValue(false);
  const onRestRef = useRef(onRest);
  useLayoutEffect(() => {
    onRestRef.current = onRest;
  }, [onRest]);

  const notify = useCallback(() => onRestRef.current(), []);

  useAnimatedReaction(
    () => isWatching.get() && animatedIndex.get() >= 0,
    (isAtRest, wasAtRest) => {
      if (!isAtRest || wasAtRest) return;
      isWatching.set(false);
      runOnJS(notify)();
    },
  );

  const watch = useCallback(() => isWatching.set(true), [isWatching]);
  const stop = useCallback(() => isWatching.set(false), [isWatching]);

  return { animatedIndex, watch, stop };
};

export default useReturnToRest;
