import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaleSpace(6, layout),
    },
    chip: {
      minHeight: 26,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(5, layout),
      paddingLeft: scaleSpace(7, layout),
      paddingRight: scaleSpace(9, layout),
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
      fontSize: scaleFont(11.5, layout),
      lineHeight: scaleFont(16, layout),
      color: colors.muted,
    },
    labelMet: {
      color: colors.okText,
    },
  });

export default createStyles;
