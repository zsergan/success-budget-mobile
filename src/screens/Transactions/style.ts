import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  transactionsContainer: {
    paddingTop: theme.spacing.lg,
    rowGap: theme.spacing.sm,
    marginBottom: theme.spacing.xxl,
  },
  date: {
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
    letterSpacing: theme.letterSpacing.micro,
    color: colors.muted,
  },
  mt24: {
    marginTop: theme.spacing.xxl,
  },
});

export default styles;
