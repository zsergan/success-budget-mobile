import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    lineHeight: 28,
    color: theme.colors.text.primary,
  },
  amount: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    lineHeight: 28,
    color: theme.colors.text.secondary,
  },
  divider: {
    marginVertical: 16,
  },
});

export default styles;
