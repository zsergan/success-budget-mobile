import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    rowGap: theme.spacing.xl,
    width: 110,
  },
  grey: {
    backgroundColor: colors.track,
  },
  gradient: {
    borderRadius: theme.radius.sm,
  },
  // Default (grey background) text color; overridden inline in
  // TinyWallet.tsx to the gradient preset's `fg` when backgroundStyle is
  // 'gradient' — same near-white-on-dark-card need as WalletCard.
  walletName: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  currencyCode: {
    fontFamily: theme.fonts.medium,
    fontSize: 8,
    color: colors.text,
    alignSelf: 'flex-end',
  },
});

export default styles;
