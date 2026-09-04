import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  quickRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    columnGap: 7,
  },
  quickChip: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  quickChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  quickText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  quickTextActive: {
    color: colors.onSecondary,
  },
  fromToRow: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  fromToChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 13,
    rowGap: 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  fromToChipActive: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  fromToLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  fromToValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  calendarRoot: {
    marginTop: theme.spacing.lg,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  monthLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  dowRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
  },
  dowCell: {
    flex: 1,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dowLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellBand: {
    backgroundColor: `${colors.accent}1A`,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.accent,
  },
  dayText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
  dayTextMuted: {
    color: 'transparent',
  },
  dayTextActive: {
    fontFamily: theme.fonts.semiBold,
    color: colors.onAccent,
  },
  summary: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
  },
  applyButton: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  applyButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.onAccent,
  },
});

export default styles;
