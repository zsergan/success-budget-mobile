import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// iOS reports the keyboard before it moves, so the form resizes along with it; Android only once it is up.
const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

const useKeyboardHeight = () => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener(SHOW_EVENT, (event) => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener(HIDE_EVENT, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
};

export default useKeyboardHeight;
