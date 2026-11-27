import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    arrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    arrowDisabled: {
      opacity: 0.35,
    },
    // Large text wraps the month onto two lines; each line stays centred between the arrows.
    center: {
      flex: 1,
      alignItems: 'center',
      rowGap: 1,
    },
    label: {
      textAlign: 'center',
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.text,
    },
    sub: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    back: {
      paddingRight: 2,
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
      textDecorationLine: 'underline',
    },
  });

export default createStyles;
