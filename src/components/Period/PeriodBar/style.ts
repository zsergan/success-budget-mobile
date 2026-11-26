import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import { fitHeight } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.sm,
    },
    rangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
    },
    rangeButton: {
      flex: 1,
      ...fitHeight(40, theme.lineHeights.label, 1),
      borderRadius: 13,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 9,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    rangeLabel: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      letterSpacing: -0.1,
      color: colors.text,
    },
    resetChip: {
      ...fitHeight(40, theme.lineHeights.caption),
      paddingHorizontal: theme.spacing.md,
      borderRadius: 13,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
      backgroundColor: colors.track,
    },
    resetText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    // Wraps instead of running off the screen under large text.
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 7,
      rowGap: 7,
    },
    presetChip: {
      ...fitHeight(32, theme.lineHeights.caption, 1),
      paddingHorizontal: theme.spacing.md + 2,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    presetChipActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    presetText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      letterSpacing: 0.1,
      color: colors.muted,
    },
    presetTextActive: {
      color: colors.onSecondary,
    },
  });

export default createStyles;
