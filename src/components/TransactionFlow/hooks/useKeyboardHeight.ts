import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

// iOS reports the keyboard before it moves, so the form resizes along with it; Android only once it is up.
const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

const useKeyboardHeight = () => {
  const [height, setHeight] = useState(() => Keyboard.metrics()?.height ?? 0);

  useEffect(() => {
    const show = Keyboard.addListener(SHOW_EVENT, (event) => setHeight(event.endCoordinates.height));
    const hide = Keyboard.addListener(HIDE_EVENT, () => setHeight(0));
    const frame =
      Platform.OS === 'ios'
        ? Keyboard.addListener('keyboardWillChangeFrame', (event) => {
            const { height: frameHeight, screenY } = event.endCoordinates;
            setHeight(Math.max(0, Math.min(frameHeight, Dimensions.get('window').height - screenY)));
          })
        : null;

    return () => {
      show.remove();
      hide.remove();
      frame?.remove();
    };
  }, []);

  return height;
};

export default useKeyboardHeight;
