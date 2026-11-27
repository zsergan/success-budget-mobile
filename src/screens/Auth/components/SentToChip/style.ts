import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      marginTop: scaleSpace(3, layout),
      alignSelf: 'flex-start',
      maxWidth: '100%',
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(8, layout),
      paddingVertical: scaleSpace(6, layout),
      paddingLeft: scaleSpace(12, layout),
      paddingRight: scaleSpace(6, layout),
      borderRadius: 13,
      backgroundColor: colors.track,
    },
    // Wraps a long address instead of truncating it, even at the largest text size.
    email: {
      flexShrink: 1,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(13.5, layout),
      lineHeight: scaleFont(19, layout),
      color: colors.text,
    },
    change: {
      minHeight: 26,
      justifyContent: 'center',
      paddingHorizontal: scaleSpace(10, layout),
      borderRadius: 9,
      backgroundColor: colors.elevated,
    },
    changeText: {
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(12, layout),
      lineHeight: scaleFont(16, layout),
      color: colors.text,
    },
    changeTextDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
