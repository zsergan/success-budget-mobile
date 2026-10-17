import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const LARGE_BUTTON_MIN_HEIGHT = 56;
const OUTLINE_WIDTH = 1;

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
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
      borderWidth: OUTLINE_WIDTH,
      borderColor: colors.hairline,
      backgroundColor: colors.elevated,
    },
    tertiaryButton: {
      backgroundColor: 'transparent',
    },
    dangerButton: {
      backgroundColor: colors.danger,
    },
    // Grows with its label under large system text instead of clipping it. At the default size it stays 56 tall,
    // the outlined one included: its border sits outside the padding.
    largeButton: {
      height: 'auto',
      minHeight: LARGE_BUTTON_MIN_HEIGHT,
      paddingVertical: (LARGE_BUTTON_MIN_HEIGHT - theme.lineHeights.bodyLg) / 2 - OUTLINE_WIDTH,
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
      color: colors.onDanger,
    },
    largeButtonText: {
      fontFamily: theme.fonts.bold,
      fontSize: 15.5,
      letterSpacing: -0.1,
    },
    primaryButtonTextDisabled: {
      color: colors.muted,
    },
    // Hugs its label so it stays centred with the spinner beside it.
    busyText: {
      flex: 0,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    withShadow: { ...elevation.card },
    accentGlow: { ...elevation.accentGlow },
    disabled: {
      opacity: 0.5,
    },
  });

export default createStyles;
