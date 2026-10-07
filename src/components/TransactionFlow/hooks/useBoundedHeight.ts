import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import theme from '@shared/theme';
import useKeyboardHeight from './useKeyboardHeight';

const HEIGHT_FRACTION = 0.86;

// The form and its panels take most of the screen, and above the keyboard only what is left, so Save stays in view.
// Android already resizes the window for the keyboard (adjustResize), so only iOS takes its height off again.
const useBoundedHeight = () => {
  const { height: windowHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const keyboardInset = Platform.OS === 'ios' ? keyboardHeight : 0;

  const height = Math.min(
    windowHeight * HEIGHT_FRACTION,
    keyboardHeight > 0 ? windowHeight - keyboardInset - top - theme.spacing.sm : Infinity,
  );

  return { height, keyboardHeight };
};

export default useBoundedHeight;
