import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    title: {
      marginTop: 26,
    },
    section: {
      marginTop: theme.spacing.md,
      rowGap: theme.spacing.md,
    },
    rows: {
      rowGap: theme.spacing.sm,
    },
    empty: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    loadingContainer: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Grows with its label under large text instead of clipping it.
    history: {
      minHeight: 50,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: theme.spacing.sm,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    historyText: {
      flexShrink: 1,
      paddingRight: 2,
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
  });

export default createStyles;
