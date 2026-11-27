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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    label: sectionLabel(colors),
    author: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    // Chips wrap onto new lines, so every choice is in view without scrolling sideways.
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaleSpace(theme.spacing.sm, layout),
    },
    expanded: {
      maxHeight: 220,
    },
    chip: {
      maxWidth: 200,
      minHeight: 40,
      borderRadius: 13,
      paddingLeft: scaleSpace(7, layout),
      paddingRight: scaleSpace(12, layout),
      paddingVertical: scaleSpace(5, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(7, layout),
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.hairline,
    },
    chipGone: {
      borderStyle: 'dashed',
      borderColor: colors.faint,
    },
    moreChip: {
      paddingLeft: scaleSpace(12, layout),
      backgroundColor: 'transparent',
      borderStyle: 'dashed',
    },
    chipTexts: {
      flexShrink: 1,
      minWidth: 0,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    chipText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
    },
    chipDetail: {
      paddingRight: 2,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      color: colors.muted,
    },
    mutedText: {
      color: colors.muted,
    },
    ghostRow: {
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    ghostChip: {
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.track,
    },
    compact: {
      minHeight: 56,
      borderRadius: scaleSpace(theme.spacing.lg, layout),
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
      borderWidth: 1.5,
    },
    compactTexts: {
      flex: 1,
      minWidth: 0,
      rowGap: 2,
    },
    compactHint: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    loadError: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    loadErrorText: {
      ...sectionNote(colors),
    },
    retryText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
      textDecorationLine: 'underline',
    },
    spelled: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    note: sectionNote(colors),
    errorText: {
      color: colors.dangerText,
    },
  });

export default createStyles;
