import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { fitHeight, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const LARGE_BUTTON_MIN_HEIGHT = 56;
const OUTLINE_WIDTH = 1;

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    button: {
      // The outline sits inside the height, so every variant is 52 tall at the default text size.
      ...fitHeight(52, scaleFont(theme.lineHeights.bodyLg, layout), OUTLINE_WIDTH),
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.radius.md,
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
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
      minHeight: LARGE_BUTTON_MIN_HEIGHT,
      paddingVertical: (LARGE_BUTTON_MIN_HEIGHT - scaleFont(theme.lineHeights.bodyLg, layout)) / 2 - OUTLINE_WIDTH,
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
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
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
      fontSize: scaleFont(15.5, layout),
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
