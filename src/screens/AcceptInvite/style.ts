import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'space-between',
    },
    sectionsContainer: {
      rowGap: scaleSpace(theme.spacing.xl, layout),
    },
    actions: {
      rowGap: scaleSpace(theme.spacing.md, layout),
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
  });

export default createStyles;
