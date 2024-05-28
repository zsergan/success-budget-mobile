import { StyleSheet } from 'react-native';

import theme, { palette, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 5,
  },
  primaryButton: {
    backgroundColor: palette.yellow,
  },
  secondaryButton: {
    backgroundColor: palette.greyDark,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
  },
  primaryButtonText: {
    color: theme.colors.text.primary,
  },
  secondaryButtonText: {
    color: palette.white,
  },
  tertiaryButtonText: {
    color: theme.colors.text.primary,
  },
  withShadow: { ...shadow },
  disabled: {
    opacity: 0.5,
  },
});

export default styles;
