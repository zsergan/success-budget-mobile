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
  primaryButtonDisabled: {
    backgroundColor: colors.track,
  },
  buttonText: {
    // flex: 1 + textAlign so the Text's box comes from the row's layout,
    // not from Yoga's own font-intrinsic measurement — Plus Jakarta Sans
    // under-measures and clips the last glyph otherwise (see cde3346).
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
  primaryButtonTextDisabled: {
    color: colors.muted,
  },
  withShadow: { ...shadow },
  disabled: {
    opacity: 0.5,
  },
});

export default styles;
