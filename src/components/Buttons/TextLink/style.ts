import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      paddingBottom: 1,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.accent,
    },
    title: {
      // Plus Jakarta Sans under-measures; see cde3346.
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: 13.5,
      lineHeight: 18,
      color: colors.text,
    },
  });

export default createStyles;
