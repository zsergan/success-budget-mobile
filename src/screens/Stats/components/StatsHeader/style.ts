import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingBottom: scaleSpace(14, layout),
      paddingHorizontal: screenPadding(layout),
      rowGap: scaleSpace(14, layout),
      backgroundColor: colors.bg,
    },
    titleBlock: {
      rowGap: 2,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('titleLg', scaleFont(26, layout), layout),
      lineHeight: capRole('titleLg', scaleFont(32, layout), layout),
      letterSpacing: -0.7,
      color: colors.text,
    },
    space: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
  });

export default createStyles;
