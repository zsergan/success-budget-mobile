import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

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
    color: colors.text,
  },
  balance: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.lg,
    color: colors.text,
  },
  total: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.sm,
    color: colors.text,
  },
  totalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
});

export default styles;
