import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  transactionsContainer: {
    rowGap: 8,
  },
  card: {
    rowGap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    marginBottom: 8,
    fontFamily: theme.fonts.bold,
    color: theme.colors.text.primary,
  },
  mt16: {
    marginTop: 16,
  },
  name: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  amount: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.text.secondary,
  },
  expense: {
    color: theme.colors.text.error,
  },
  income: {
    color: theme.colors.text.success,
  },
  description: {
    alignSelf: 'flex-end',
    fontFamily: theme.fonts.bold,
    color: theme.colors.text.primary,
  },
});

export default styles;
