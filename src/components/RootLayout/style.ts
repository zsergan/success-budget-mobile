import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
});

export default styles;
