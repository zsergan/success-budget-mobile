import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 5,
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
  buttonText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
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
  withShadow: { ...shadow },
  disabled: {
    opacity: 0.5,
  },
});

export default styles;
