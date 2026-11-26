import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    title: {
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.sm,
      fontFamily: theme.fonts.bold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
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
      minHeight: 34,
      paddingHorizontal: 14,
      paddingVertical: theme.spacing.xs,
      borderRadius: 11,
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
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    quickText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
    quickTextActive: {
      color: colors.bg,
    },
    note: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    footer: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      rowGap: theme.spacing.xs,
    },
  });

export default createStyles;
