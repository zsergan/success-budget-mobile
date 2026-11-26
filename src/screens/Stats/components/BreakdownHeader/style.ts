import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      marginTop: scaleSpace(22, layout),
      marginBottom: scaleSpace(10, layout),
      rowGap: scaleSpace(10, layout),
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      letterSpacing: -0.2,
      color: colors.text,
    },
    modes: {
      flexDirection: 'row',
      columnGap: scaleSpace(7, layout),
    },
    chip: {
      minHeight: 32,
      paddingHorizontal: scaleSpace(14, layout),
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    chipActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    chipText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    chipTextActive: {
      color: colors.onSecondary,
    },
  });

export default createStyles;
