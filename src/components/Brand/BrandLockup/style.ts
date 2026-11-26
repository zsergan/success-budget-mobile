import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    inline: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    inlineName: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(17, layout),
      lineHeight: scaleFont(22, layout),
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
      marginTop: scaleSpace(22, layout),
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(26, layout),
      lineHeight: scaleFont(32, layout),
      letterSpacing: -0.6,
      textAlign: 'center',
      color: colors.text,
    },
    tagline: {
      alignSelf: 'stretch',
      marginTop: scaleSpace(6, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      textAlign: 'center',
      color: colors.muted,
    },
  });

export default createStyles;
