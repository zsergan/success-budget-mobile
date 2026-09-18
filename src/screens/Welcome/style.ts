import { StyleSheet } from 'react-native';

import theme, { colors, horizontalScreenPadding } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: horizontalScreenPadding,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.md,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  logoText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    letterSpacing: -0.3,
    color: colors.text,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    rowGap: theme.spacing.lg,
  },
  headline: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
    color: colors.text,
  },
  description: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    color: colors.muted,
  },
  points: {
    rowGap: theme.spacing.sm + 3,
    marginTop: theme.spacing.xs,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm + 2,
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
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  footer: {
    rowGap: theme.spacing.sm + 3,
  },
  footerNote: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    textAlign: 'center',
    color: colors.muted,
    marginTop: theme.spacing.xs,
  },
});

export default styles;
