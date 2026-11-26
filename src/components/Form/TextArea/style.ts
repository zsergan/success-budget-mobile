import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    input: {
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.text,
      backgroundColor: colors.track,
      borderRadius: theme.radius.sm,
    },
  });

export default createStyles;
