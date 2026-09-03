import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xs,
  },
  input: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    borderRadius: theme.radius.sm,
    backgroundColor: colors.surface,
  },
  withError: {
    borderColor: colors.danger,
    borderWidth: 1,
  },
  inputWithLeftIcon: {
    paddingLeft: theme.spacing.lg + 32 + theme.spacing.md,
  },
  inputWithRightIcon: {
    paddingRight: theme.spacing.lg + 32 + theme.spacing.md,
  },
  inputWithShadow: { ...shadow },
  icon: {
    position: 'absolute',
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    zIndex: 1,
  },
  iconLeft: {
    left: theme.spacing.xl,
  },
  iconRight: {
    right: theme.spacing.xl,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  error: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.danger,
  },
});

export default styles;
