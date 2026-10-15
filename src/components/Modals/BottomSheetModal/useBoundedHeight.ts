import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import theme from '@shared/theme';
import { FITTED_SHEET_HANDLE_HEIGHT } from '@components/Modals/BottomSheetModal/BottomSheetModal';
import useKeyboardHeight from '@hooks/useKeyboardHeight';

// The form and its panels take most of the screen, and above the keyboard only what is left, so Save stays in view.
// Android already resizes the window for the keyboard (adjustResize), so only iOS takes its height off again.
const useBoundedHeight = (heightFraction = 0.86) => {
  const { height: windowHeight } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const keyboardInset = Platform.OS === 'ios' ? keyboardHeight : 0;

  const height = Math.max(
    0,
    Math.min(windowHeight * heightFraction, windowHeight - keyboardInset - top - theme.spacing.sm) -
      FITTED_SHEET_HANDLE_HEIGHT,
  );

  return { height, keyboardHeight };
};

export default useBoundedHeight;
