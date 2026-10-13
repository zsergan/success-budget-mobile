import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  totalCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 13,
    rowGap: 3,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  totalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  totalLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  totalValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 17,
    letterSpacing: -0.4,
    color: colors.text,
  },
  totalUnknown: {
    color: colors.muted,
  },
  totalPlaceholder: {
    height: 17,
    marginVertical: 2,
    width: '70%',
    borderRadius: 6,
    backgroundColor: colors.track,
  },
  searchRow: {
    // 14 below the presets, as in the design, with the root's row gap.
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  searchLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  searchCount: {
    // Plus Jakarta SemiBold under-measures a hugging label and clips its last glyph (see cde3346).
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
    color: colors.muted,
  },
});

export default styles;
