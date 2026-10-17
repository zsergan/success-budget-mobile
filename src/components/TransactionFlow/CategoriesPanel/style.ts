import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      rowGap: theme.spacing.lg,
    },
    search: {
      height: 44,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md + 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.label,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    grid: {
      marginHorizontal: -5,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    cell: {
      width: '25%',
      paddingHorizontal: 5,
      marginBottom: 14,
      alignItems: 'center',
      rowGap: 6,
    },
    iconBox: {
      width: '100%',
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.hairline,
    },
    name: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 10,
      lineHeight: 13,
      textAlign: 'center',
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
