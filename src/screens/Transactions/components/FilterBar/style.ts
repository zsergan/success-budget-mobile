import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: theme.spacing.xl,
    rowGap: theme.spacing.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  rangeButton: {
    flex: 1,
    height: 40,
    borderRadius: 13,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  rangeLabel: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    letterSpacing: -0.1,
    color: colors.text,
  },
  resetChip: {
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: colors.track,
  },
  resetText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.text,
  },
  presetsRow: {
    flexDirection: 'row',
    columnGap: 7,
  },
  presetChip: {
    height: 32,
    paddingHorizontal: theme.spacing.md + 2,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  presetChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  presetText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.1,
    color: colors.muted,
  },
  presetTextActive: {
    color: colors.onSecondary,
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
});

export default styles;
