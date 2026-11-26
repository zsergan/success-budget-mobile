import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      minHeight: 28,
      borderRadius: 9,
      paddingHorizontal: scaleSpace(10, layout),
      paddingVertical: scaleSpace(6, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
    },
    // SemiBold under-measures its width in a content-sized text (see cde3346).
    text: {
      flexShrink: 1,
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
  });

export default createStyles;
