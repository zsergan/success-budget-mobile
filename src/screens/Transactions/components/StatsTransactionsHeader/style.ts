import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    header: {
      paddingTop: 6,
      paddingBottom: 14,
      rowGap: theme.spacing.xs,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      columnGap: 3,
      minHeight: 30,
      marginLeft: -4,
    },
    backLabel: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleLg,
      lineHeight: theme.lineHeights.titleLg,
      letterSpacing: theme.letterSpacing.titleLg,
      color: colors.text,
    },
  });

export default createStyles;
