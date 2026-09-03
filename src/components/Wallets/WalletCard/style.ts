import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    height: 176,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    justifyContent: 'space-between',
    ...shadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  gradient: {
    borderRadius: theme.radius.lg,
  },
  // Color comes from the wallet's own gradient preset (`walletTextColors`
  // in constants.ts), not `theme.colors` — every preset is a dark card
  // that needs near-white text regardless of the app's own light/dark
  // theme, so it's applied inline in WalletCard.tsx instead of here.
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
  totalBlock: {
    flex: 1,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.sm + 2,
    rowGap: 3,
  },
});

export default styles;
