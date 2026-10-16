import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      rowGap: theme.spacing.md,
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
    note: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      letterSpacing: 0.3,
      color: colors.muted,
    },
    summary: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.text,
    },
    wheel: {
      alignSelf: 'stretch',
    },
    timeButton: {
      alignSelf: 'flex-start',
      height: 44,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    // SemiBold under-measures its width in a content-sized box (see cde3346).
    timeText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.text,
    },
    footer: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    cancelButton: {
      flex: 1,
      height: 52,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    cancelText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.text,
    },
    applyButton: {
      flex: 1,
      height: 52,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text,
    },
    applyText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.bg,
    },
  });

export default createStyles;
