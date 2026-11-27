import { Keyboard, Text, TouchableOpacity } from 'react-native';

import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

// A number pad has no return key. React Native's own answer is a toolbar the keyboard draws on its grey glass,
// flush with its top edge; a field that passes NO_KEYBOARD_TOOLBAR gets none, and its screen shows this instead:
// a plain Done, 4pt above the keyboard. The screen places it at its bottom edge, which sits on the keyboard.
export const NO_KEYBOARD_TOOLBAR = 'no-keyboard-toolbar';

const KeyboardDoneButton = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={Keyboard.dismiss}
      hitSlop={10}
      accessibilityRole="button"
      testID="keyboard-done"
    >
      <Text style={styles.label}>Done</Text>
    </TouchableOpacity>
  );
};

export default KeyboardDoneButton;
