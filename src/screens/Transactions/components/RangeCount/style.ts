import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    row: {
      minHeight: scaleFont(theme.lineHeights.bodySm, layout),
      marginTop: scaleSpace(theme.spacing.xs, layout),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
    retry: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.text,
    },
  });

export default createStyles;
