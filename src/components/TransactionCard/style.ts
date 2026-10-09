import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  rootPressed: {
    backgroundColor: colors.track,
  },
  rootHighlighted: {
    backgroundColor: hexToRgba(colors.accent, 0.14),
  },
  rootBusy: {
    opacity: 0.5,
  },
  // Covers the Delete action under it while the row is dragged.
  swipeContent: {
    backgroundColor: colors.bg,
  },
  deleteAction: {
    width: 92,
    marginLeft: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 2,
    backgroundColor: colors.danger,
  },
  deleteActionText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: '#FFFDFA',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxIncome: {
    backgroundColor: `${colors.ok}26`,
  },
  iconBoxExpense: {
    backgroundColor: colors.track,
  },
  iconBoxSystem: {
    borderRadius: 21,
    backgroundColor: colors.track,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    rowGap: 3,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  lineStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metaLine: {
    flexDirection: 'row',
  },
  metaLineWrapped: {
    flexWrap: 'wrap',
  },
  category: {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    color: colors.text,
  },
  meta: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  metaFaint: {
    opacity: 0.7,
  },
  description: {
    flexShrink: 1,
  },
  // Hugging Plus Jakarta Sans boxes under-measure by a pixel or two (see cde3346); without the buffer "Cash" ellipsizes.
  walletBeside: {
    flexShrink: 0,
    maxWidth: '30%',
    paddingRight: 2,
  },
  walletAlone: {
    flexShrink: 1,
  },
  fixed: {
    flexShrink: 0,
    paddingRight: 2,
  },
  amount: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    color: colors.text,
  },
  income: {
    color: colors.ok,
  },
});

export default styles;
