import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const KEYBOARD_GAP = 4;

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    button: {
      position: 'absolute',
      right: screenPadding(layout),
      bottom: KEYBOARD_GAP,
      paddingVertical: scaleSpace(theme.spacing.xs, layout),
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      // A filled, lightly outlined button of its own, not a bar across the keyboard.
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: hexToRgba(colors.accent, 0.45),
      borderRadius: theme.radius.sm,
    },
    label: {
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.accent,
    },
  });

export default createStyles;
