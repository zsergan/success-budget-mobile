import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  options: {
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    backgroundColor: colors.elevated,
    borderRadius: theme.radius.sm,
    ...shadow,
  },
  option: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    columnGap: theme.spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    color: colors.text,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.muted,
  },
});

export default styles;
