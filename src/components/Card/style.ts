import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    padding: 16,
    borderRadius: theme.border.radius,
    backgroundColor: theme.colors.background.primary,
    ...shadow,
  },
});

export default styles;
