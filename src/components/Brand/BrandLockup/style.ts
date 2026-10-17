import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    inline: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
    },
    inlineName: {
      fontFamily: theme.fonts.bold,
      fontSize: 17,
      lineHeight: 22,
      letterSpacing: -0.3,
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    stacked: {
      alignItems: 'center',
    },
    stackedName: {
      alignSelf: 'stretch',
      marginTop: 22,
      fontFamily: theme.fonts.bold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.6,
      textAlign: 'center',
      color: colors.text,
    },
    tagline: {
      alignSelf: 'stretch',
      marginTop: 6,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      textAlign: 'center',
      color: colors.muted,
    },
  });

export default createStyles;
