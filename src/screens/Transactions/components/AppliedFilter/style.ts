import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.md,
    },
    context: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: theme.spacing.sm,
    },
    tags: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
      maxWidth: '100%',
      minHeight: 32,
      paddingVertical: 6,
      paddingHorizontal: 11,
      borderRadius: 11,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    tagLabel: {
      flexShrink: 1,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    clearButton: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    summary: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.xs,
    },
    range: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
      paddingRight: 2,
    },
    total: {
      fontFamily: theme.fonts.bold,
      fontSize: 17,
      lineHeight: theme.lineHeights.bodyLg,
      letterSpacing: -0.4,
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
  });

export default createStyles;
