import { StyleSheet } from 'react-native';

import { colors } from '@shared/theme';

const styles = StyleSheet.create({
  circle: {
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleWithBorder: {
    borderWidth: 0.5,
    borderColor: colors.hairline,
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
});

export default styles;
