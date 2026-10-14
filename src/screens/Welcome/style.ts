import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

// Below the status bar and above the screen's bottom edge, as in the design's frame; the bottom one clears the
// home indicator's area on its own.
export const TOP_GAP = 44;
export const BOTTOM_GAP = 40;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    rowGap: 18,
    // 12pt above the middle of the room between the lockup and the buttons, as the design's bottom padding of 24
    // puts it, while keeping a gap to both when a short screen has no room to spare.
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.xxl * 2,
  },
  headline: {
    fontFamily: theme.fonts.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.5,
    color: colors.text,
  },
  description: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: 25,
    color: colors.muted,
  },
  points: {
    rowGap: 11,
    marginTop: 6,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
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
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
  },
  footer: {
    rowGap: 11,
  },
  footerNote: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    textAlign: 'center',
    color: colors.muted,
  },
});

export default styles;
