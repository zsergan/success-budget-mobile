import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const card = {
  borderRadius: theme.radius.md,
  borderWidth: 1,
  borderColor: colors.hairline,
  backgroundColor: colors.surface,
};

const styles = StyleSheet.create({
  root: {
    rowGap: 10,
  },
  totalsRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  totalCard: {
    ...card,
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    paddingHorizontal: 13,
    rowGap: 3,
  },
  totalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  label: {
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
  comparison: {
    minHeight: 28,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
  },
  netCard: {
    ...card,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: theme.spacing.md,
  },
  netText: {
    flex: 1,
    minWidth: 0,
    rowGap: 3,
  },
  netValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.7,
    color: colors.text,
  },
  netSurplus: {
    color: colors.ok,
  },
  netDeficit: {
    color: colors.danger,
  },
  chip: {
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 9,
    justifyContent: 'center',
  },
  chipSurplus: {
    backgroundColor: hexToRgba(colors.ok, 0.14),
  },
  chipDeficit: {
    backgroundColor: hexToRgba(colors.danger, 0.12),
  },
  chipBalanced: {
    backgroundColor: colors.track,
  },
  chipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  chipTextSurplus: {
    color: colors.ok,
  },
  chipTextDeficit: {
    color: colors.danger,
  },
  sample: {
    opacity: 0,
  },
  fill: {
    flex: 1,
  },
});

export default styles;
