import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

// Shared by Home's two breakdown blocks.
export const createBreakdownStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    title: {
      marginTop: scaleSpace(26, layout),
    },
    card: {
      marginTop: scaleSpace(theme.spacing.sm, layout),
      borderRadius: 18,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    row: {
      minHeight: 58,
      paddingVertical: scaleSpace(theme.spacing.sm, layout) + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
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
      rowGap: scaleSpace(6, layout),
    },
    // Under large text the amount took the whole line and cut the name to a letter or two; it goes below instead.
    line: {
      flexDirection: layout.isLargeText ? 'column' : 'row',
      alignItems: layout.isLargeText ? 'flex-start' : 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      rowGap: 2,
    },
    name: {
      flex: layout.isLargeText ? undefined : 1,
      minWidth: 0,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    nameMuted: {
      color: colors.muted,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
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
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    empty: {
      marginTop: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
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
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
    },
    placeholder: {
      minHeight: 96,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    retry: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
      textDecorationLine: 'underline',
    },
  });

export default createBreakdownStyles;
