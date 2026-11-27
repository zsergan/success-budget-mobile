import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    // No flex: 1 — a dynamically-sized sheet measures this ScrollView's
    // natural content height, which flex: 1 would override.
    root: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(theme.spacing.lg, layout),
    },
    handle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      alignSelf: 'center',
      backgroundColor: colors.track,
    },
    header: {
      marginTop: scaleSpace(theme.spacing.md, layout) + 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleSm', layout),
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
      marginTop: scaleSpace(theme.spacing.lg, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(7, layout),
    },
    quickChip: {
      flex: 1,
      minHeight: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    // Inverted like the sheet's main action: `secondary` is the sheet's own colour in the dark theme.
    quickChipActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    quickText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    quickTextActive: {
      color: colors.bg,
    },
    fromToRow: {
      marginTop: scaleSpace(theme.spacing.lg, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    fromToChip: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: scaleSpace(10, layout),
      paddingHorizontal: scaleSpace(13, layout),
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
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    fromToValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
    },
    stepper: {
      marginTop: scaleSpace(theme.spacing.lg, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      borderRadius: 14,
      padding: scaleSpace(9, layout),
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
      marginTop: scaleSpace(theme.spacing.lg, layout),
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
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
    },
    dowRow: {
      marginTop: scaleSpace(theme.spacing.md, layout),
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
      fontSize: scaleFont(theme.fontSizes.micro, layout),
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
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
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
      marginTop: scaleSpace(theme.spacing.md, layout),
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
    summaryError: {
      color: colors.danger,
    },
    applyButton: {
      marginTop: scaleSpace(theme.spacing.md, layout),
      marginBottom: scaleSpace(theme.spacing.xl, layout),
      minHeight: 52,
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
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.onAccent,
    },
  });

export default createStyles;
