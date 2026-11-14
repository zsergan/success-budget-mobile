import { useWindowDimensions } from 'react-native';

import { useKeyboardHeight } from '@hooks';

// An iPhone SE is 667 points tall: with the keyboard up, only the field and the primary action fit.
const SMALL_SCREEN_HEIGHT = 700;

const useKeyboardLayout = () => {
  const isKeyboardUp = useKeyboardHeight() > 0;
  const { height } = useWindowDimensions();

  return { isKeyboardUp, isCompact: isKeyboardUp && height < SMALL_SCREEN_HEIGHT };
};

export default useKeyboardLayout;
