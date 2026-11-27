import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.sm,
    },
    rootPressed: {
      backgroundColor: colors.track,
    },
    rootHighlighted: {
      backgroundColor: hexToRgba(colors.accent, 0.14),
    },
    rootBusy: {
      opacity: 0.5,
    },
    // Covers the Delete action under it while the row is dragged.
    swipeContent: {
      backgroundColor: colors.bg,
    },
    deleteAction: {
      width: 92,
      marginLeft: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: 2,
      backgroundColor: colors.danger,
    },
    deleteActionText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.onDanger,
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxSystem: {
      borderRadius: 21,
      backgroundColor: colors.track,
    },
    textColumn: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(3, layout),
    },
    topLine: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    lineStacked: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    metaLine: {
      flexDirection: 'row',
    },
    metaLineWrapped: {
      flexWrap: 'wrap',
    },
    titleRow: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
    },
    tag: {
      flexShrink: 0,
      paddingHorizontal: scaleSpace(6, layout),
      paddingVertical: 1,
      borderRadius: 6,
      overflow: 'hidden',
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      color: colors.muted,
      backgroundColor: colors.track,
    },
    category: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.text,
    },
    meta: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    metaFaint: {
      opacity: 0.7,
    },
    description: {
      flexShrink: 1,
    },
    // Hugging Plus Jakarta Sans boxes under-measure by a pixel or two (see cde3346); without the buffer "Lena" ellipsizes.
    assignmentBeside: {
      flexShrink: 0,
      maxWidth: '40%',
      paddingRight: 2,
    },
    assignmentAlone: {
      flexShrink: 1,
    },
    fixed: {
      flexShrink: 0,
      paddingRight: 2,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.text,
    },
    income: {
      color: colors.ok,
    },
  });

export default createStyles;
