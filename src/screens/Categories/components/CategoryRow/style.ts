import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    rowArchived: {
      backgroundColor: 'transparent',
    },
    rowActive: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
    },
    textContainer: {
      flex: 1,
      minWidth: 0,
      rowGap: 3,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm - 2,
    },
    name: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg - 1,
      color: colors.text,
    },
    nameArchived: {
      color: colors.muted,
    },
    limitPill: {
      height: 19,
      paddingHorizontal: 7,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    limitPillText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 10,
      color: colors.muted,
    },
    meta: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
    trailing: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    restorePill: {
      height: 30,
      paddingHorizontal: theme.spacing.sm + 2,
      borderRadius: theme.radius.md - 3,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 5,
      backgroundColor: colors.track,
    },
    restorePillText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      color: colors.text,
    },
  });

export default createStyles;
