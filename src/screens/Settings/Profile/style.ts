import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
  cell: {
    flex: 1,
    alignSelf: 'stretch',
    fontFamily: theme.fonts.bold,
  },
  name: {
    color: theme.colors.text.primary,
  },
  value: {
    color: theme.colors.text.secondary,
  },
});

export default styles;
