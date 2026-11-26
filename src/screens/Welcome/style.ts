import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { inset, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

// Below the status bar and above the screen's bottom edge, as in the design's frame; the bottom one clears the
// home indicator's area on its own. A phone with a home button has neither a notch nor an indicator to clear.
export const screenGaps = ({ isShort }: Pick<Layout, 'isShort'>) =>
  isShort ? { top: theme.spacing.xxl, bottom: theme.spacing.xxl } : { top: 44, bottom: 40 };

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: inset(26, layout),
    },
    body: {
      flex: 1,
      justifyContent: 'center',
      rowGap: scaleSpace(18, layout),
      // 12pt above the middle of the room between the lockup and the buttons, as the design's bottom padding of 24
      // puts it, while keeping a gap to both when a short screen has no room to spare.
      paddingTop: scaleSpace(theme.spacing.xxl, layout),
      paddingBottom: scaleSpace(theme.spacing.xxl, layout) * 2,
    },
    headline: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(40, layout),
      lineHeight: scaleFont(44, layout),
      letterSpacing: -1.5,
      color: colors.text,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(25, layout),
      color: colors.muted,
    },
    points: {
      rowGap: scaleSpace(11, layout),
      marginTop: scaleSpace(6, layout),
    },
    point: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(10, layout),
    },
    pointIconBox: {
      width: 26,
      height: 26,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    pointLabel: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    footer: {
      rowGap: scaleSpace(11, layout),
    },
    footerNote: {
      marginTop: scaleSpace(theme.spacing.xs, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      textAlign: 'center',
      color: colors.muted,
    },
  });

export default createStyles;
