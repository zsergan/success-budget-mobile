import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    circle: {
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleWithBorder: {
      borderWidth: 0.5,
      borderColor: colors.hairline,
    },
    xsCircle: {
      width: 28,
      height: 28,
    },
    smCircle: {
      width: 34,
      height: 34,
    },
    mdCircle: {
      width: 40,
      height: 40,
    },
    lgCircle: {
      width: 48,
      height: 48,
    },
    xlCircle: {
      width: 56,
      height: 56,
    },
  });

export default createStyles;
