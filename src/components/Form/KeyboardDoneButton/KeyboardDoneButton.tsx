import { Keyboard, Text, TouchableOpacity } from 'react-native';

import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

// Stands in for RN's grey number-pad toolbar, which a field gets from `returnKeyType`; the amount fields pass none.
// Not `inputAccessoryViewID` either: RN drops it on a reused field (docs/ui-pitfalls.md).

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
