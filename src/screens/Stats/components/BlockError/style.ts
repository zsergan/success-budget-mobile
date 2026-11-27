import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    card: {
      padding: scaleSpace(14, layout),
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: scaleSpace(10, layout),
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
      textAlign: 'center',
    },
    retryButton: {
      minHeight: 36,
      paddingHorizontal: scaleSpace(14, layout),
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(7, layout),
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    retryText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
  });

export default createStyles;
