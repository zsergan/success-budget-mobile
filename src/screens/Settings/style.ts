import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    rowGap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
});

export default styles;
