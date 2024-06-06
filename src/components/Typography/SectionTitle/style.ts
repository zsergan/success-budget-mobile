import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
});

export default styles;
