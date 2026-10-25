import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const MIN_HEIGHT = 52;
const OUTLINE_WIDTH = 1;

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    // Grows with its label under large system text instead of clipping it; 52 tall at the default size.
    action: {
      minHeight: MIN_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 9,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: (MIN_HEIGHT - theme.lineHeights.bodyLg) / 2,
      borderRadius: 16,
    },
    neutral: {
      backgroundColor: colors.neutral,
    },
    danger: {
      backgroundColor: colors.destructive,
    },
    // The border sits outside the padding, so it keeps the same height as a filled action.
    outline: {
      paddingVertical: (MIN_HEIGHT - theme.lineHeights.bodyLg) / 2 - OUTLINE_WIDTH,
      borderWidth: OUTLINE_WIDTH,
      borderColor: colors.line,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      flexShrink: 1,
      textAlign: 'center',
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    neutralLabel: {
      color: colors.onNeutral,
    },
    dangerLabel: {
      color: colors.onDestructive,
    },
    outlineLabel: {
      color: colors.text,
    },
    outlineDangerLabel: {
      color: colors.destructive,
    },
  });

export default createStyles;
