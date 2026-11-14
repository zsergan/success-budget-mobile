import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      marginTop: 3,
      alignSelf: 'flex-start',
      maxWidth: '100%',
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 8,
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 6,
      borderRadius: 13,
      backgroundColor: colors.track,
    },
    // Wraps a long address instead of truncating it, even at the largest text size.
    email: {
      flexShrink: 1,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: 13.5,
      lineHeight: 19,
      color: colors.text,
    },
    change: {
      minHeight: 26,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderRadius: 9,
      backgroundColor: colors.elevated,
    },
    changeText: {
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: 12,
      lineHeight: 16,
      color: colors.text,
    },
    changeTextDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
