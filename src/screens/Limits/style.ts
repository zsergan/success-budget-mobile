import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xl,
  },
  noLimitsContainer: {
    height: '95%',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: theme.spacing.md,
  },
  noLimits: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.md,
    color: colors.muted,
  },
  button: {
    width: '50%',
    ...shadow,
  },
});

export default styles;
