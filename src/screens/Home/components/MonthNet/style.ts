import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    card: {
      marginTop: theme.spacing.md,
      borderRadius: 22,
      padding: theme.spacing.lg,
      rowGap: theme.spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      letterSpacing: 0.3,
      color: colors.muted,
    },
    badge: {
      marginLeft: 'auto',
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 9,
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
      fontSize: theme.fontSizes.micro,
    },
    net: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.display,
      lineHeight: theme.lineHeights.display + 4,
      letterSpacing: theme.letterSpacing.display,
    },
    split: {
      flexDirection: 'row',
      columnGap: theme.spacing.md,
    },
    part: {
      flex: 1,
      rowGap: 2,
    },
    partLabel: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    partValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      color: colors.text,
    },
    income: {
      color: colors.okText,
    },
    placeholder: {
      minHeight: 92,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: theme.spacing.sm,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      color: colors.muted,
    },
    retry: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
      textDecorationLine: 'underline',
    },
  });

export default createStyles;
