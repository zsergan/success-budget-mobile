import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { fitHeight, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    rangeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    rangeButton: {
      flex: 1,
      ...fitHeight(40, scaleFont(theme.lineHeights.label, layout), 1),
      borderRadius: 13,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(9, layout),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    rangeLabel: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      letterSpacing: -0.1,
      color: colors.text,
    },
    resetChip: {
      ...fitHeight(40, scaleFont(theme.lineHeights.caption, layout)),
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      borderRadius: 13,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
      backgroundColor: colors.track,
    },
    resetText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    // Wraps instead of running off the screen under large text.
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: scaleSpace(7, layout),
      rowGap: scaleSpace(7, layout),
    },
    presetChip: {
      ...fitHeight(32, scaleFont(theme.lineHeights.caption, layout), 1),
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
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
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      letterSpacing: 0.1,
      color: colors.muted,
    },
    presetTextActive: {
      color: colors.onSecondary,
    },
  });

export default createStyles;
