import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flexShrink: 1,
      paddingTop: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      rowGap: theme.spacing.sm,
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    body: {
      alignItems: 'center',
      rowGap: theme.spacing.sm,
    },
    timerTrack: {
      alignSelf: 'stretch',
      height: 3,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: colors.track,
    },
    timerBar: {
      height: 3,
      // Shrinks toward the left edge; scaleX alone would shrink toward the middle.
      transformOrigin: 'left',
    },
    check: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      marginTop: theme.spacing.sm,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleSm,
      lineHeight: theme.lineHeights.titleSm,
      color: colors.text,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleLg,
      lineHeight: theme.lineHeights.titleLg,
      letterSpacing: theme.letterSpacing.titleLg,
    },
    facts: {
      alignSelf: 'stretch',
      marginTop: theme.spacing.sm,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    fact: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
    },
    factSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    factLabel: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      color: colors.muted,
    },
    factPerson: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
    },
    factValue: {
      flexShrink: 1,
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      textAlign: 'right',
      color: colors.text,
    },
    hiddenRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: colors.track,
    },
    hiddenText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    // SemiBold under-measures its width in a content-sized label (see cde3346).
    banner: {
      alignSelf: 'stretch',
      marginTop: theme.spacing.sm,
    },
    undoText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    undoButton: {
      width: 124,
      minHeight: 52,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: theme.spacing.xs,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    accentButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: theme.spacing.xs,
      backgroundColor: colors.accent,
    },
    accentButtonText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.onAccent,
    },
    doneButton: {
      width: 104,
      minHeight: 52,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    actionsLocked: {
      opacity: 0.4,
    },
    actions: {
      alignSelf: 'stretch',
      marginTop: theme.spacing.sm,
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    secondaryButton: {
      flex: 1,
      minHeight: 52,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    secondaryButtonText: {
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.text,
    },
    primaryButton: {
      flex: 1,
      minHeight: 52,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text,
    },
    primaryButtonText: {
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.bg,
    },
  });

export default createStyles;
