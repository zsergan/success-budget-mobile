import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const TOTAL_LINE_HEIGHT = 22;
const TOTAL_PLACEHOLDER_HEIGHT = 17;
// The small spinner's size: the row keeps it once the spinner is gone.
const SEARCH_ROW_HEIGHT = 20;

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
    lineHeight: TOTAL_LINE_HEIGHT,
    letterSpacing: -0.4,
    color: colors.text,
  },
  totalUnknown: {
    color: colors.muted,
  },
  totalPlaceholder: {
    height: TOTAL_PLACEHOLDER_HEIGHT,
    marginVertical: (TOTAL_LINE_HEIGHT - TOTAL_PLACEHOLDER_HEIGHT) / 2,
    width: '70%',
    borderRadius: 6,
    backgroundColor: colors.track,
  },
  searchRow: {
    // 14 below the presets, as in the design, with the root's row gap.
    marginTop: 6,
    height: SEARCH_ROW_HEIGHT,
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
