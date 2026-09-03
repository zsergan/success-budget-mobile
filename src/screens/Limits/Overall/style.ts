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
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleMd,
    lineHeight: theme.lineHeights.titleMd,
    letterSpacing: theme.letterSpacing.titleMd,
    color: colors.text,
  },
  note: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
});

export default styles;
