import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    // No flex: 1 — a dynamically-sized sheet measures this ScrollView's
    // natural content height, which flex: 1 would override.
    root: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.lg,
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      alignSelf: 'center',
      backgroundColor: colors.track,
    },
    header: {
      marginTop: theme.spacing.md + 2,
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
    stepper: {
      marginTop: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      borderRadius: 14,
      padding: 9,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    stepperCenter: {
      flex: 1,
      alignItems: 'center',
      rowGap: 2,
    },
    // Plus Jakarta Sans under-measures hug-width text and clips its last glyph.
    stepperText: {
      paddingRight: 2,
    },
    stepperLink: {
      fontFamily: theme.fonts.semiBold,
      color: colors.accent,
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
    navButtonDisabled: {
      opacity: 0.35,
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
    dayCellDisabled: {
      opacity: 0.35,
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
    summaryError: {
      color: colors.danger,
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
    applyButtonDisabled: {
      opacity: 0.4,
    },
    applyButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.onAccent,
    },
  });

export default createStyles;
