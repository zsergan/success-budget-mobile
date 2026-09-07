import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    height: 52,
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.track,
  },
  buttonText: {
    // Plus Jakarta Sans under-measures; see cde3346.
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
  },
  primaryButtonText: {
    color: colors.onAccent,
  },
  secondaryButtonText: {
    color: colors.onSecondary,
  },
  tertiaryButtonText: {
    color: colors.text,
  },
  dangerButtonText: {
    color: '#FFFDFA',
  },
  primaryButtonTextDisabled: {
    color: colors.muted,
  },
  withShadow: { ...shadow },
  disabled: {
    opacity: 0.5,
  },
});

export default styles;
