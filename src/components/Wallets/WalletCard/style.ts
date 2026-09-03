import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    justifyContent: 'space-between',
    rowGap: theme.spacing.xxl,
  },
  bottomInfo: {
    rowGap: theme.spacing.xs,
  },
  gradient: {
    borderRadius: theme.radius.sm,
  },
  // Color comes from the wallet's own gradient preset (`walletTextColors`
  // in constants.ts), not `theme.colors` — every preset is a dark card
  // that needs near-white text regardless of the app's own light/dark
  // theme, so it's applied inline in WalletCard.tsx instead of here.
  name: {
    fontFamily: theme.fonts.medium,
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
  totalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
});

export default styles;
