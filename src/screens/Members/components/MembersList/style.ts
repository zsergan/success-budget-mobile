import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  section: {
    rowGap: theme.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  countLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  hint: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  rows: {
    rowGap: theme.spacing.sm - 2,
  },
});

export default styles;
