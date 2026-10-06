import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  heroLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
    letterSpacing: theme.letterSpacing.micro,
    textTransform: 'uppercase',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: 4,
  },
  heroAmount: {
    minWidth: 24,
    fontFamily: theme.fonts.semiBold,
    fontSize: 52,
    letterSpacing: -2,
    padding: 0,
  },
  heroCurrency: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    opacity: 0.65,
  },
  heroSub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
});

export default styles;
