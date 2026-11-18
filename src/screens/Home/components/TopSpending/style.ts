import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

// Shared by Home's two breakdown blocks.
export const createBreakdownStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    title: {
      marginTop: 26,
    },
    card: {
      marginTop: theme.spacing.sm,
      borderRadius: 18,
      paddingHorizontal: theme.spacing.md + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    row: {
      minHeight: 58,
      paddingVertical: theme.spacing.sm + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
    },
    rowSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    rowPressed: {
      opacity: 0.6,
    },
    body: {
      flex: 1,
      minWidth: 0,
      rowGap: 6,
    },
    line: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    nameMuted: {
      color: colors.muted,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    track: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      backgroundColor: colors.track,
    },
    fill: {
      height: 6,
      borderRadius: 3,
    },
    sub: {
      marginTop: 2,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    empty: {
      marginTop: theme.spacing.sm,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    more: {
      minHeight: 44,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    moreText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    placeholder: {
      minHeight: 96,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: theme.spacing.sm,
    },
    retry: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
      textDecorationLine: 'underline',
    },
  });

export default createBreakdownStyles;
