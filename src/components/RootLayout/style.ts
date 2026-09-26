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
  scroll: {
    paddingHorizontal: theme.spacing.xl,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
  },
});

export default styles;
