import { StyleSheet } from 'react-native';

import { palette } from '@shared/theme';

const styles = StyleSheet.create({
  circle: {
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWithBorder: {
    borderWidth: 0.5,
    borderColor: palette.black,
  },
  smCircle: {
    width: 16,
    height: 16,
  },
  mdCircle: {
    width: 24,
    height: 24,
  },
  lgCircle: {
    width: 32,
    height: 32,
  },
  xlCircle: {
    width: 48,
    height: 48,
  },
  icon: {
    transform: [{ translateX: 0.25 }, { translateY: 0.5 }],
  },
});

export default styles;
