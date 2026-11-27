import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    pill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 42,
      borderRadius: 15,
      paddingLeft: scaleSpace(7, layout),
      paddingRight: scaleSpace(theme.spacing.md, layout),
      columnGap: scaleSpace(9, layout),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    iconBox: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    name: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
      maxWidth: 160,
    },
    currencyBadge: {
      minHeight: 21,
      paddingHorizontal: scaleSpace(7, layout),
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    currencyBadgeText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      letterSpacing: theme.letterSpacing.micro,
      color: colors.text,
    },
    sheetContent: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(theme.spacing.lg, layout),
      rowGap: scaleSpace(theme.spacing.md, layout),
    },
    handle: {
      width: 38,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      backgroundColor: colors.track,
    },
    sheetHeader: {
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    sheetTitle: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    sheetSubtitle: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
    rows: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
      padding: scaleSpace(theme.spacing.sm, layout) + 2,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    rowActive: {
      backgroundColor: `${colors.accent}1A`,
      borderColor: colors.accent,
    },
    rowIconBox: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    rowText: {
      flex: 1,
      rowGap: scaleSpace(3, layout),
    },
    rowName: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
    rowMeta: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    createRow: {
      minHeight: 52,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 1,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    createRowText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
  });

export default createStyles;
