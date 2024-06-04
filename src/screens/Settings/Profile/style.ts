import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  profile: {
    alignItems: 'center',
  },
  name: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
  email: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.secondary,
  },
});

export default styles;
