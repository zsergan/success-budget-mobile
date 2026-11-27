import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      marginTop: 2,
      rowGap: scaleSpace(8, layout),
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    labelError: {
      color: colors.danger,
    },
    paste: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(5, layout),
    },
    pasteUnderline: {
      paddingBottom: 1,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.accent,
    },
    pasteText: {
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(12.5, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.text,
    },
    mutedText: {
      color: colors.muted,
    },
    cells: {
      flexDirection: 'row',
      columnGap: scaleSpace(8, layout),
    },
    cell: {
      flex: 1,
      pointerEvents: 'none',
      height: 60,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cellFilled: {
      backgroundColor: colors.elevated,
    },
    cellDisabled: {
      backgroundColor: colors.track,
    },
    cellActive: {
      borderColor: colors.text,
      boxShadow: `0 0 0 4px ${colors.focusRing}`,
    },
    cellActiveError: {
      boxShadow: `0 0 0 4px ${colors.focusRingError}`,
    },
    cellError: {
      borderColor: colors.danger,
    },
    digit: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(25, layout),
      letterSpacing: -0.3,
      fontVariant: ['tabular-nums'],
      color: colors.text,
    },
    caret: {
      position: 'absolute',
      width: 2,
      height: 26,
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    // Covers the boxes so a tap or long-press anywhere on them reaches the one real field.
    // iOS skips touches on a view under 0.01 opacity (0.01 itself rounds below as a float), so the field stays faintly opaque.
    field: {
      ...StyleSheet.absoluteFill,
      opacity: 0.02,
      backgroundColor: 'transparent',
      color: 'transparent',
      fontSize: scaleFont(16, layout),
    },
    message: {
      minHeight: 17,
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(6, layout),
      paddingLeft: 2,
    },
    errorIcon: {
      marginTop: 2,
    },
    errorText: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(12, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.danger,
    },
    hintText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(12, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.muted,
    },
  });

export default createStyles;
