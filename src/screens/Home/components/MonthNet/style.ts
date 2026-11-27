import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    card: {
      marginTop: scaleSpace(theme.spacing.md, layout),
      borderRadius: 22,
      padding: scaleSpace(theme.spacing.lg, layout),
      rowGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      letterSpacing: 0.3,
      color: colors.muted,
    },
    badge: {
      marginLeft: 'auto',
      minHeight: 22,
      borderRadius: 11,
      paddingHorizontal: scaleSpace(9, layout),
      justifyContent: 'center',
    },
    badgeOk: {
      backgroundColor: colors.okSoft,
    },
    badgeDanger: {
      backgroundColor: colors.dangerSoft,
    },
    badgeNeutral: {
      backgroundColor: colors.track,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    badgeText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
    },
    // The month's figure follows the width fully, so it keeps its room in the card on an SE.
    net: {
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('display', scaleFont(theme.fontSizes.display, layout, 1), layout),
      lineHeight: capRole('display', scaleFont(theme.lineHeights.display + 4, layout, 1), layout),
      letterSpacing: theme.letterSpacing.display,
    },
    // Side by side the two amounts are cut short under large text; they stack instead.
    split: {
      flexDirection: layout.isLargeText ? 'column' : 'row',
      columnGap: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    part: {
      flex: layout.isLargeText ? undefined : 1,
      rowGap: 2,
    },
    partLabel: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    partValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.text,
    },
    income: {
      color: colors.okText,
    },
    placeholder: {
      minHeight: 92,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
    retry: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
      textDecorationLine: 'underline',
    },
  });

export default createStyles;
