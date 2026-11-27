import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    // The sheet's container centres its content; the list takes the full width.
    root: {
      flex: 1,
      alignSelf: 'stretch',
      rowGap: scaleSpace(theme.spacing.md, layout),
      paddingTop: scaleSpace(theme.spacing.sm, layout),
    },
    title: {
      paddingHorizontal: screenPadding(layout),
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    search: {
      marginHorizontal: screenPadding(layout),
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      borderRadius: theme.radius.md,
      backgroundColor: colors.track,
    },
    searchInput: {
      flex: 1,
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
    list: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: scaleSpace(theme.spacing.lg, layout),
      rowGap: 2,
    },
    row: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: scaleSpace(theme.spacing.sm, layout),
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.md,
    },
    rowSelected: {
      backgroundColor: colors.track,
    },
    symbolBox: {
      width: 40,
      height: 40,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    symbol: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      rowGap: 1,
    },
    name: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    code: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      letterSpacing: 0.3,
      color: colors.muted,
    },
    empty: {
      paddingVertical: scaleSpace(theme.spacing.xxl, layout),
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
  });

export default createStyles;
