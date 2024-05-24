import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    color: theme.colors.text.primary,
  },
});

export default styles;
