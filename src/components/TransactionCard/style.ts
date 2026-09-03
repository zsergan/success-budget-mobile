import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

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
    color: colors.text,
  },
  time: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: colors.muted,
  },
  amount: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
  },
  income: {
    color: colors.ok,
  },
  expense: {
    color: colors.danger,
  },
  wallet: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: colors.muted,
  },
});

export default styles;
