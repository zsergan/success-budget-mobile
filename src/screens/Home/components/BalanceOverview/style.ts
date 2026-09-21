import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  hero: {
    rowGap: 5,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: theme.spacing.md,
  },
  heroInfo: {
    rowGap: 5,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
  },
  heroLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  heroTotal: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.display,
    lineHeight: theme.lineHeights.display,
    letterSpacing: theme.letterSpacing.display,
    color: colors.text,
  },
  heroSub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  deltaBadge: {
    marginTop: 20,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  deltaText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
  },
});

export default styles;
