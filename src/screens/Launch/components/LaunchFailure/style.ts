import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      alignItems: 'center',
      rowGap: scaleSpace(6, layout),
    },
    title: {
      alignSelf: 'stretch',
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      letterSpacing: -0.1,
      textAlign: 'center',
      color: colors.text,
    },
    text: {
      alignSelf: 'stretch',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(12.5, layout),
      lineHeight: scaleFont(18, layout),
      textAlign: 'center',
      color: colors.muted,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      minHeight: 44,
      marginTop: scaleSpace(theme.spacing.md, layout),
      paddingVertical: scaleSpace(theme.spacing.sm, layout) + 2,
      paddingHorizontal: screenPadding(layout),
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.elevated,
    },
    buttonDimmed: {
      opacity: 0.6,
    },
    buttonLabel: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
  });

export default createStyles;
