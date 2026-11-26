import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    footer: {
      marginTop: scaleSpace(theme.spacing.md, layout),
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    resetNote: {
      borderRadius: theme.radius.sm,
      padding: scaleSpace(theme.spacing.sm, layout) + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) - 1,
      backgroundColor: colors.track,
    },
    resetNoteText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    footerRow: {
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    deleteButton: {
      width: 54,
      minHeight: 54,
      flexShrink: 0,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(colors.danger, 0.1),
    },
    saveButton: {
      flex: 1,
      minHeight: 54,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(9, layout),
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
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      letterSpacing: -0.1,
      color: colors.muted,
    },
    saveButtonTextReady: {
      color: colors.onAccent,
    },
  });

export default createStyles;
