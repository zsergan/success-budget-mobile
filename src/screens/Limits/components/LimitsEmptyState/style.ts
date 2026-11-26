import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    emptyBlock: {
      marginTop: scaleSpace(theme.spacing.lg, layout),
      rowGap: scaleSpace(theme.spacing.lg, layout),
    },
    rules: {
      rowGap: scaleSpace(theme.spacing.sm, layout) + 1,
    },
    ruleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    ruleText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
  });

export default createStyles;
