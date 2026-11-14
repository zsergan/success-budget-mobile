import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
      minHeight: 28,
      borderRadius: 9,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
    },
    // SemiBold under-measures its width in a content-sized text (see cde3346).
    text: {
      flexShrink: 1,
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
  });

export default createStyles;
