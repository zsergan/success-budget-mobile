import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { sectionLabel, sectionNote } from '../sectionStyle';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    section: {
      rowGap: scaleSpace(10, layout),
    },
    labelRow: {
      minHeight: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(10, layout),
    },
    label: sectionLabel(colors),
    pill: {
      maxWidth: '72%',
      minHeight: 24,
      borderRadius: 8,
      paddingHorizontal: scaleSpace(9, layout),
      justifyContent: 'center',
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    pillText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    // The tiles' own bottom margin is the gap between rows; the last row's is taken back.
    grid: {
      marginHorizontal: -scaleSpace(theme.spacing.xs, layout),
      marginBottom: -scaleSpace(theme.spacing.md, layout),
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    ghostCell: {
      marginBottom: scaleSpace(theme.spacing.md, layout),
      alignItems: 'center',
      rowGap: scaleSpace(7, layout),
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
      marginVertical: scaleSpace(3, layout),
      borderRadius: 5,
      backgroundColor: colors.track,
    },
    empty: {
      borderRadius: 18,
      paddingVertical: scaleSpace(18, layout),
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    emptyTitle: {
      alignSelf: 'stretch',
      textAlign: 'center',
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(15, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    emptyText: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.muted,
    },
    createButton: {
      marginTop: scaleSpace(theme.spacing.xs, layout),
      minHeight: 40,
      borderRadius: 13,
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(7, layout),
      backgroundColor: colors.secondary,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    createButtonText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.onSecondary,
    },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    note: sectionNote(colors),
  });

export default createStyles;
