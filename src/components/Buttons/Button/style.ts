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
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.elevated,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  largeButton: {
    height: 56,
    borderRadius: 18,
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
  outlineButtonText: {
    color: colors.text,
  },
  tertiaryButtonText: {
    color: colors.text,
  },
  dangerButtonText: {
    color: '#FFFDFA',
  },
  largeButtonText: {
    fontFamily: theme.fonts.bold,
    fontSize: 15.5,
    letterSpacing: -0.1,
  },
  primaryButtonTextDisabled: {
    color: colors.muted,
  },
  withShadow: { ...shadow },
  accentGlow: {
    boxShadow: '0 12px 26px -12px rgba(255, 176, 32, 0.7)',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default styles;
