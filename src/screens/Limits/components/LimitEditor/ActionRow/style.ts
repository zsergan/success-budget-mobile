import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    footer: {
      marginTop: theme.spacing.md,
      marginHorizontal: theme.spacing.xl,
      rowGap: theme.spacing.sm,
    },
    resetNote: {
      borderRadius: theme.radius.sm,
      padding: theme.spacing.sm + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm - 1,
      backgroundColor: colors.track,
    },
    resetNoteText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    footerRow: {
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    deleteButton: {
      width: 54,
      height: 54,
      flexShrink: 0,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(colors.danger, 0.1),
    },
    saveButton: {
      flex: 1,
      height: 54,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 9,
      backgroundColor: colors.track,
    },
    saveButtonReady: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 24,
    },
    saveButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      letterSpacing: -0.1,
      color: colors.muted,
    },
    saveButtonTextReady: {
      color: colors.onAccent,
    },
  });

export default createStyles;
