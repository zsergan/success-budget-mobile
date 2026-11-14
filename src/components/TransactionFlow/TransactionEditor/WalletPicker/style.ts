import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { sectionLabel, sectionNote } from '../sectionStyle';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: 10,
    },
    label: sectionLabel(colors),
    // The row runs to the screen's edges, past the form's side padding.
    scroll: {
      marginHorizontal: -theme.spacing.xl,
    },
    row: {
      paddingHorizontal: theme.spacing.xl,
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    chip: {
      maxWidth: 170,
      height: 40,
      borderRadius: 13,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.hairline,
    },
    deletedChip: {
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
      borderColor: colors.faint,
    },
    newChip: {
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 3.5,
    },
    deletedDot: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.faint,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    chipText: {
      paddingRight: 2,
      flexShrink: 1,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    mutedText: {
      color: colors.muted,
    },
    ghostRow: {
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    ghostChip: {
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.track,
    },
    empty: {
      borderRadius: 18,
      padding: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    emptyTexts: {
      flex: 1,
      minWidth: 0,
      rowGap: 3,
    },
    emptyTitle: {
      fontFamily: theme.fonts.bold,
      fontSize: 15,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    emptyText: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: 17,
      color: colors.muted,
    },
    createButton: {
      height: 40,
      borderRadius: 13,
      paddingHorizontal: theme.spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
      backgroundColor: colors.secondary,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    createButtonText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.label,
      color: colors.onSecondary,
    },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: theme.spacing.sm,
    },
    note: sectionNote(colors),
  });

export default createStyles;
