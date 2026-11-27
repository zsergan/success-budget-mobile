import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    section: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    // Wraps the count under the label when large text leaves no room beside it.
    sectionHeaderRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    countLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    rows: {
      rowGap: scaleSpace(theme.spacing.sm, layout) - 2,
    },
    refreshErrorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.xs, layout),
    },
    retryLink: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.accent,
    },
  });

export default createStyles;
