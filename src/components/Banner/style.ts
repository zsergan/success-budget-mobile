import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.md,
      paddingVertical: scaleSpace(theme.spacing.sm, layout) + 2,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
    },
    textColumn: {
      flex: 1,
      rowGap: 2,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.text,
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    action: {
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(4, layout),
    },
    // SemiBold under-measures its width in a content-sized label (see cde3346).
    actionText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
      textDecorationLine: 'underline',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(11, layout),
      paddingVertical: scaleSpace(13, layout),
      paddingHorizontal: scaleSpace(14, layout),
      borderRadius: 16,
      borderWidth: 1,
    },
    cardIcon: {
      marginTop: 1,
    },
    cardTextColumn: {
      flex: 1,
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    cardTitle: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(13.5, layout),
      lineHeight: scaleFont(18, layout),
      letterSpacing: -0.1,
    },
    cardText: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(12.5, layout),
      lineHeight: scaleFont(18, layout),
    },
    cardAction: {
      marginTop: scaleSpace(6, layout),
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
      minWidth: 44,
      minHeight: 32,
      paddingHorizontal: scaleSpace(13, layout),
      justifyContent: 'center',
      borderRadius: 11,
      borderWidth: 1,
      backgroundColor: colors.elevated,
    },
    // Bold under-measures its width in a content-sized label (see cde3346).
    cardActionText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
  });

export default createStyles;
