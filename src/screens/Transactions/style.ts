import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  transactionsContainer: {
    rowGap: theme.spacing.sm,
    marginBottom: theme.spacing.xxl,
  },
  date: {
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
  mt24: {
    marginTop: theme.spacing.xxl,
  },
});

export default styles;
