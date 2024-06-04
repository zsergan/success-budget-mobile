import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    rowGap: theme.spacing.lg,
  },
  menu: {
    rowGap: theme.spacing.sm,
  },
});

export default styles;
