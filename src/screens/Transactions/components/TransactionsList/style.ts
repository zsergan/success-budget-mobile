import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

// SectionList has no group wrapper for gaps: days use groupHeaderSpaced.marginTop,
// header to row groupHeader.marginBottom, rows itemSeparator.
const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    body: {
      flex: 1,
    },
    container: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: FAB_SCROLL_CLEARANCE,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: scaleSpace(theme.spacing.sm, layout),
    },
    groupHeaderFirst: {
      marginTop: scaleSpace(theme.spacing.md, layout),
    },
    groupHeaderSpaced: {
      marginTop: scaleSpace(theme.spacing.lg, layout),
    },
    groupLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      letterSpacing: theme.letterSpacing.micro,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    groupTotal: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      color: colors.muted,
    },
    groupTotalPositive: {
      color: colors.ok,
    },
    pageStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: scaleSpace(theme.spacing.sm, layout),
      marginTop: scaleSpace(theme.spacing.lg, layout),
    },
    pageError: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      color: colors.muted,
    },
    pageRetry: {
      // Plus Jakarta SemiBold under-measures a hugging label and clips its last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      color: colors.accent,
    },
    itemSeparator: {
      height: scaleSpace(theme.spacing.md, layout),
    },
  });

export default createStyles;
