import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

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
    color: colors.text,
  },
  email: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: colors.muted,
  },
});

export default styles;
