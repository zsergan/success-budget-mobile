import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -theme.spacing.xl,
  },
  scrollContainer: {
    flexDirection: 'row',
    columnGap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
});

export default styles;
