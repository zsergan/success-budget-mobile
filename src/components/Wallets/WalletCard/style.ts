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
  name: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.primary,
  },
  balance: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.primary,
  },
  total: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
  totalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
});

export default styles;
