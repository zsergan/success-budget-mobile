import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    padding: theme.spacing.sm,
    backgroundColor: colors.track,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    columnGap: theme.spacing.xs,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: colors.accent,
  },
  disabled: {
    opacity: 0.3,
  },
  title: {
    fontFamily: theme.fonts.medium,
  },
  smTitle: {
    fontSize: theme.fontSizes.xs,
  },
  mdTitle: {
    fontSize: theme.fontSizes.sm,
  },
});

export default styles;
