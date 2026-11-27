import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      paddingTop: theme.spacing.md,
      paddingBottom: 14,
      paddingHorizontal: screenPadding(layout),
      rowGap: 14,
      backgroundColor: colors.bg,
    },
    titleBlock: {
      rowGap: 2,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('titleLg', 26, layout),
      lineHeight: capRole('titleLg', 32, layout),
      letterSpacing: -0.7,
      color: colors.text,
    },
    space: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
  });

export default createStyles;
