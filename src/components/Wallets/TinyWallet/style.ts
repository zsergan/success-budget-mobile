import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
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
    // Default (grey) color; overridden inline in TinyWallet.tsx to the gradient preset's `fg` on a gradient card.
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

export default createStyles;
