import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    title: {
      marginTop: 26,
    },
    section: {
      marginTop: 8,
    },
    activity: {
      rowGap: theme.spacing.md,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    groupLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    groupTotal: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    groupTotalPositive: {
      color: colors.ok,
    },
    groupItems: {
      rowGap: theme.spacing.sm,
    },
    loadingContainer: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default createStyles;
