import { InputAccessoryView, Keyboard, Platform, Text, TouchableOpacity, View } from 'react-native';

import useKeyboardHeight from '@hooks/useKeyboardHeight';
import useThemedStyles from '@hooks/useThemedStyles';

import createStyles from './style';

interface Props {
  // The field passes the same id as its `inputAccessoryViewID`.
  nativeID: string;
}

// Stands in for React Native's default toolbar over a number pad, which has no return key: a full-width bar with a
// tall Done that the app cannot style. This one is a compact Done button, clear of the keyboard's edge. It shows only
// over the on-screen keyboard; with a hardware keyboard iOS would draw it at the bottom of the screen instead.
const KeyboardDoneBar = ({ nativeID }: Props) => {
  const styles = useThemedStyles(createStyles);
  const isKeyboardUp = useKeyboardHeight() > 0;

  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={nativeID} backgroundColor="transparent">
      {isKeyboardUp && (
        <View style={styles.bar}>
          <TouchableOpacity style={styles.button} onPress={Keyboard.dismiss} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.label}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </InputAccessoryView>
  );
};

export default KeyboardDoneBar;
