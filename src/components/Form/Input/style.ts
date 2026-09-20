import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xs,
  },
  input: {
    height: 52,
    paddingHorizontal: theme.spacing.lg,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    borderRadius: theme.radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  focused: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  withError: {
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  disabledInput: {
    backgroundColor: colors.track,
    color: colors.muted,
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
