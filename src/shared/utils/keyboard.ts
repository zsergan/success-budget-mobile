import { Keyboard } from 'react-native';

const KEYBOARD_WAIT_MS = 600;

// Dismisses the keyboard and runs `show` once it has gone; returns a cancel, or null when there was none and it ran at
// once. A sheet that rises with the keyboard stays risen if it renders as the keyboard starts to go (a library race).
export const afterKeyboardHides = (show: () => void): (() => void) | null => {
  if (!Keyboard.isVisible()) {
    show();
    return null;
  }

  const subscription = Keyboard.addListener('keyboardDidHide', () => finish());
  const timeout = setTimeout(() => finish(), KEYBOARD_WAIT_MS);
  const cancel = () => {
    subscription.remove();
    clearTimeout(timeout);
  };
  const finish = () => {
    cancel();
    show();
  };
  Keyboard.dismiss();

  return cancel;
};
