import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: theme.spacing.md,
    backgroundColor: colors.track,
  },
  check: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    color: colors.text,
  },
  amount: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    lineHeight: theme.lineHeights.titleLg,
    letterSpacing: theme.letterSpacing.titleLg,
  },
  meta: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.muted,
  },
  balance: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  secondaryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  primaryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.bg,
  },
});

export default styles;
