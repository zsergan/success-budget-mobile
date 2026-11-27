import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    bar: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(6, layout),
      paddingBottom: scaleSpace(theme.spacing.xs, layout),
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      columnGap: scaleSpace(3, layout),
      minHeight: 30,
      marginLeft: -scaleSpace(4, layout),
    },
    backLabel: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleLg', layout),
      letterSpacing: theme.letterSpacing.titleLg,
      color: colors.text,
      paddingBottom: scaleSpace(14, layout),
    },
  });

export default createStyles;
