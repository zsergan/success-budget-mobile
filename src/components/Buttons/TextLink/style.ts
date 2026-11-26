import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
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
      fontSize: scaleFont(13.5, layout),
      lineHeight: scaleFont(18, layout),
      color: colors.text,
    },
  });

export default createStyles;
