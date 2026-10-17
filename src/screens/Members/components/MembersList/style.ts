import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: theme.spacing.sm,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    countLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    rows: {
      rowGap: theme.spacing.sm - 2,
    },
    refreshErrorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.xs,
    },
    retryLink: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.accent,
    },
  });

export default createStyles;
