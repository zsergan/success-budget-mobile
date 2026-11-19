import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.md,
      rowGap: 4,
    },
    title: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.titleSm,
      lineHeight: theme.lineHeights.titleSm,
      color: colors.text,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    section: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: 4,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.micro,
      lineHeight: theme.lineHeights.micro,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    row: {
      minHeight: 56,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    texts: {
      flex: 1,
      minWidth: 0,
      rowGap: 1,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    sub: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
  });

export default createStyles;
