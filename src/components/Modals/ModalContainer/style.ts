import { StyleSheet } from 'react-native';
import { palette } from '@shared/theme';

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dark: {
    backgroundColor: palette.black,
    opacity: 0.75,
  },
});

export default styles;
