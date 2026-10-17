import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      minHeight: 26,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 5,
      paddingLeft: 7,
      paddingRight: 9,
      borderRadius: 9,
      backgroundColor: colors.track,
    },
    chipMet: {
      backgroundColor: colors.okSoft,
    },
    label: {
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: 11.5,
      lineHeight: 16,
      color: colors.muted,
    },
    labelMet: {
      color: colors.okText,
    },
  });

export default createStyles;
