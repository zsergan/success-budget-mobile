import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xl,
  },
  section: {
    rowGap: theme.spacing.md,
  },
  selectedCategory: {
    ...shadow,
  },
});

export default styles;
