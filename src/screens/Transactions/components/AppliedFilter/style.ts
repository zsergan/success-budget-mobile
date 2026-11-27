import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(theme.spacing.md, layout),
    },
    tags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaleSpace(7, layout),
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
      maxWidth: '100%',
      minHeight: 32,
      paddingVertical: scaleSpace(6, layout),
      paddingHorizontal: scaleSpace(11, layout),
      borderRadius: 11,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    tagLabel: {
      flexShrink: 1,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    summary: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    range: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
      paddingRight: 2,
    },
    total: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(17, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      letterSpacing: -0.4,
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
  });

export default createStyles;
