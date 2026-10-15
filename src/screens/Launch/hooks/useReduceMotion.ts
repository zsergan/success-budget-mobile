import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

// Reanimated reads the setting once at start; this follows it when it is switched while the app runs.
const useReduceMotion = () => {
  const initial = useReducedMotion();
  const [isReduced, setIsReduced] = useState(initial);

  useEffect(() => {
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReduced);

    return () => subscription.remove();
  }, []);

  return isReduced;
};

export default useReduceMotion;
