import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      paddingBottom: scaleSpace(10, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    headerButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    headerTitle: {
      flex: 1,
      minWidth: 0,
      fontFamily: theme.fonts.bold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    count: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
    body: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(6, layout),
      paddingBottom: scaleSpace(theme.spacing.xxl, layout),
      rowGap: scaleSpace(theme.spacing.lg, layout),
    },
    search: {
      minHeight: 42,
      borderRadius: 13,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.track,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      padding: 0,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
    },
    grid: {
      marginHorizontal: -scaleSpace(theme.spacing.xs, layout),
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    note: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.muted,
    },
    noMatches: {
      paddingVertical: scaleSpace(theme.spacing.xl, layout),
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
  });

export default createStyles;
