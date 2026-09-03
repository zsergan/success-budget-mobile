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
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxIncome: {
    backgroundColor: `${colors.ok}26`,
  },
  iconBoxExpense: {
    backgroundColor: colors.track,
  },
  amountWallet: {
    alignItems: 'flex-end',
  },
  category: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    color: colors.text,
  },
  time: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  amount: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    color: colors.text,
  },
  income: {
    color: colors.ok,
  },
  wallet: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
});

export default styles;
