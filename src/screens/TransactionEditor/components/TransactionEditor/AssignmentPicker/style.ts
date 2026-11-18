import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { sectionLabel, sectionNote } from '../sectionStyle';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
    },
    label: sectionLabel(colors),
    author: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    // Chips wrap onto new lines, so every choice is in view without scrolling sideways.
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    expanded: {
      maxHeight: 220,
    },
    chip: {
      maxWidth: 200,
      minHeight: 40,
      borderRadius: 13,
      paddingLeft: 7,
      paddingRight: 12,
      paddingVertical: 5,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.hairline,
    },
    chipGone: {
      borderStyle: 'dashed',
      borderColor: colors.faint,
    },
    moreChip: {
      paddingLeft: 12,
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
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    chipDetail: {
      paddingRight: 2,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.micro,
      lineHeight: theme.lineHeights.micro,
      color: colors.muted,
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
    compact: {
      minHeight: 56,
      borderRadius: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      borderWidth: 1.5,
    },
    compactTexts: {
      flex: 1,
      minWidth: 0,
      rowGap: 2,
    },
    compactHint: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    loadError: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
    },
    loadErrorText: {
      ...sectionNote(colors),
    },
    retryText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
      textDecorationLine: 'underline',
    },
    spelled: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    noteRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: theme.spacing.sm,
    },
    note: sectionNote(colors),
    errorText: {
      color: colors.dangerText,
    },
  });

export default createStyles;
