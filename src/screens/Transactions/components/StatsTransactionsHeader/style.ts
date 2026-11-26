import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    bar: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: 6,
      paddingBottom: theme.spacing.xs,
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
      ...textRole('titleLg', layout),
      letterSpacing: theme.letterSpacing.titleLg,
      color: colors.text,
      paddingBottom: 14,
    },
  });

export default createStyles;
