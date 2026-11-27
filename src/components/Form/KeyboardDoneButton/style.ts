import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const KEYBOARD_GAP = 4;

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    button: {
      position: 'absolute',
      right: screenPadding(layout),
      bottom: KEYBOARD_GAP,
      paddingVertical: scaleSpace(theme.spacing.xs + 2, layout),
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: theme.radius.sm,
    },
    label: {
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.onAccent,
    },
  });

export default createStyles;
