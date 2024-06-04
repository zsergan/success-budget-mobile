import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xl,
  },
  pageTitle: {
    paddingBottom: 0,
  },
  selectedCategory: {
    ...shadow,
  },
});

export default styles;
