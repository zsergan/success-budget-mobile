import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    title: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      fontFamily: theme.fonts.bold,
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
      color: colors.text,
    },
    body: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: scaleSpace(theme.spacing.lg, layout),
      rowGap: scaleSpace(theme.spacing.md, layout),
    },
    quickRow: {
      marginTop: scaleSpace(theme.spacing.lg, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(7, layout),
    },
    quickChip: {
      minHeight: 34,
      paddingHorizontal: scaleSpace(14, layout),
      paddingVertical: scaleSpace(theme.spacing.xs, layout),
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
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    quickTextActive: {
      color: colors.bg,
    },
    note: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    footer: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: screenPadding(layout),
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
  });

export default createStyles;
