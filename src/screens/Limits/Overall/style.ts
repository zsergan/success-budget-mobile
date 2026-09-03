import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.surface,
    borderRadius: theme.radius.sm,
    rowGap: theme.spacing.md,
    ...shadow,
  },
  spent: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.md,
    color: colors.text,
  },
  note: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: colors.muted,
  },
});

export default styles;
