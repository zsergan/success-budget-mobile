import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    header: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleLg,
      lineHeight: theme.lineHeights.titleLg,
      letterSpacing: theme.letterSpacing.titleLg,
      color: colors.text,
    },
    periodPill: {
      height: 32,
      paddingHorizontal: theme.spacing.md - 1,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm - 1,
      backgroundColor: colors.track,
    },
    periodMonth: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.text,
    },
    periodDivider: {
      width: 1,
      height: 12,
      backgroundColor: colors.hairline,
    },
    periodDays: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
  });

export default createStyles;
