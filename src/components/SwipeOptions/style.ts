import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    backgroundColor: theme.colors.text.error,
    borderRadius: theme.border.radius,
  },
  item: {
    paddingHorizontal: 16,
  },
});

export default styles;
