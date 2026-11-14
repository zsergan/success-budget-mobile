import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { sectionLabel, sectionNote } from '../sectionStyle';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: 10,
    },
    labelRow: {
      minHeight: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: 10,
    },
    label: sectionLabel(colors),
    pill: {
      maxWidth: '72%',
      height: 24,
      borderRadius: 8,
      paddingHorizontal: 9,
      justifyContent: 'center',
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    pillText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    // The tiles' own bottom margin is the gap between rows; the last row's is taken back.
    grid: {
      marginHorizontal: -theme.spacing.xs,
      marginBottom: -theme.spacing.md,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    ghostCell: {
      marginBottom: theme.spacing.md,
      alignItems: 'center',
      rowGap: 7,
    },
    ghostBox: {
      width: 54,
      height: 54,
      borderRadius: 17,
      backgroundColor: colors.track,
    },
    ghostName: {
      width: 44,
      height: 9,
      marginVertical: 3,
      borderRadius: 5,
      backgroundColor: colors.track,
    },
    empty: {
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      rowGap: theme.spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    emptyTitle: {
      alignSelf: 'stretch',
      textAlign: 'center',
      fontFamily: theme.fonts.bold,
      fontSize: 15,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    emptyText: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: 17,
      color: colors.muted,
    },
    createButton: {
      marginTop: theme.spacing.xs,
      height: 40,
      borderRadius: 13,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
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
