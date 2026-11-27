import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    footer: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: screenPadding(layout),
      rowGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.elevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    helperText: {
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
  });

export default createStyles;
