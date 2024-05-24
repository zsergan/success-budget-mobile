import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    marginHorizontal: -20,
  },
  swipe: {
    marginBottom: 8,
    marginRight: 20,
    marginLeft: -12,
  },
  card: {
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text.primary,
    fontSize: 16,
  },
  amount: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.text.secondary,
    fontSize: 24,
  },
  swipeChildrenContainer: {
    marginBottom: 8,
  },
});

export default styles;
