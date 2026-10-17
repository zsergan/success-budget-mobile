import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
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
      height: 40,
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
      letterSpacing: -0.1,
      color: colors.text,
    },
    resetChip: {
      height: 40,
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
      color: colors.text,
    },
    presetsRow: {
      flexDirection: 'row',
      columnGap: 7,
    },
    presetChip: {
      height: 32,
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
      letterSpacing: 0.1,
      color: colors.muted,
    },
    presetTextActive: {
      color: colors.onSecondary,
    },
  });

export default createStyles;
