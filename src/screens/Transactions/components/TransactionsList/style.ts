import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding } from '@shared/layout';
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
      marginBottom: theme.spacing.sm,
    },
    groupHeaderFirst: {
      marginTop: theme.spacing.md,
    },
    groupHeaderSpaced: {
      marginTop: theme.spacing.lg,
    },
    groupLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      lineHeight: theme.lineHeights.micro,
      letterSpacing: theme.letterSpacing.micro,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    groupTotal: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      lineHeight: theme.lineHeights.micro,
      color: colors.muted,
    },
    groupTotalPositive: {
      color: colors.ok,
    },
    pageStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    pageError: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.micro,
      lineHeight: theme.lineHeights.micro,
      color: colors.muted,
    },
    pageRetry: {
      // Plus Jakarta SemiBold under-measures a hugging label and clips its last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      lineHeight: theme.lineHeights.micro,
      color: colors.accent,
    },
    itemSeparator: {
      height: theme.spacing.md,
    },
  });

export default createStyles;
