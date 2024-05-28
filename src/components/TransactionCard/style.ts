import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryNameTime: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  amountWallet: {
    alignItems: 'flex-end',
  },
  category: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
  time: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
  amount: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
  },
  income: {
    color: palette.greenDark,
  },
  expense: {
    color: palette.red,
  },
  wallet: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
});

export default styles;
