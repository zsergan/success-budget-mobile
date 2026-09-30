import { useReducedMotion } from 'react-native-reanimated';

// One duration for every Stats chart, so the trend and the donut move together.
export const CHART_ANIMATION_MS = 600;

const useChartMotion = () => {
  const isReduced = useReducedMotion();

  return { isAnimated: !isReduced, duration: CHART_ANIMATION_MS };
};

export default useChartMotion;
