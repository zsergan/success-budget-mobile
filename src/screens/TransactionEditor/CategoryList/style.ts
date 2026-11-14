import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
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
      fontSize: theme.fontSizes.titleSm,
      lineHeight: theme.lineHeights.titleSm,
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    count: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    body: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: 6,
      paddingBottom: theme.spacing.xxl,
      rowGap: theme.spacing.lg,
    },
    search: {
      height: 42,
      borderRadius: 13,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      backgroundColor: colors.track,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      padding: 0,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.label,
      color: colors.text,
    },
    grid: {
      marginHorizontal: -theme.spacing.xs,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    note: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: 17,
      color: colors.muted,
    },
    noMatches: {
      paddingVertical: theme.spacing.xl,
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
  });

export default createStyles;
