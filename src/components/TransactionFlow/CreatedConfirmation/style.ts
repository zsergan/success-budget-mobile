import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flexShrink: 1,
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: screenPadding(layout),
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    body: {
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.sm, layout),
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
      marginTop: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleSm', layout),
      color: colors.text,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleLg', layout),
      letterSpacing: theme.letterSpacing.titleLg,
    },
    facts: {
      alignSelf: 'stretch',
      marginTop: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.md,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    fact: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    factSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    factLabel: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
    factPerson: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    factValue: {
      flexShrink: 1,
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      textAlign: 'right',
      color: colors.text,
    },
    hiddenRow: {
      alignSelf: 'stretch',
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      marginTop: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.md,
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      backgroundColor: colors.track,
    },
    hiddenText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    // SemiBold under-measures its width in a content-sized label (see cde3346).
    banner: {
      alignSelf: 'stretch',
      marginTop: scaleSpace(theme.spacing.sm, layout),
    },
    undoText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
    },
    undoButton: {
      width: 124,
      minHeight: 52,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(theme.spacing.xs, layout),
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
      columnGap: scaleSpace(theme.spacing.xs, layout),
      backgroundColor: colors.accent,
    },
    accentButtonText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
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
      marginTop: scaleSpace(theme.spacing.sm, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    secondaryButton: {
      flex: 1,
      minHeight: 52,
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    secondaryButtonText: {
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
    primaryButton: {
      flex: 1,
      minHeight: 52,
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text,
    },
    primaryButtonText: {
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.bg,
    },
  });

export default createStyles;
