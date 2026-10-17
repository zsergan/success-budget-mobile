import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ elevation }: ColorTheme) =>
  StyleSheet.create({
    root: {
      height: 176,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.lg,
      justifyContent: 'space-between',
      ...elevation.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    gradient: {
      borderRadius: theme.radius.lg,
    },
    // Color comes from the wallet's own gradient preset (walletTextColors), applied inline in WalletCard.tsx, not here.
    name: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
    },
    balance: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleLg,
      lineHeight: theme.lineHeights.titleLg,
      letterSpacing: theme.letterSpacing.titleLg,
    },
    total: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
    },
    bottomInfo: {
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    badge: {
      height: 22,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 10,
      letterSpacing: 0.4,
    },
    totalBlock: {
      flex: 1,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.sm + 2,
      rowGap: 3,
    },
  });

export default createStyles;
