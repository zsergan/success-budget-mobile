import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: theme.spacing.md - 2,
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      letterSpacing: 0.3,
      color: colors.muted,
    },
    walletsRow: {
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    walletChip: {
      maxWidth: 140,
      height: 44,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 7,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.hairline,
    },
    deletedChip: {
      borderStyle: 'dashed',
    },
    newChipProminent: {
      borderColor: colors.text,
    },
    walletDot: {
      width: 12,
      height: 12,
      borderRadius: 4,
    },
    deletedDot: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.muted,
    },
    // SemiBold under-measures its width in a content-sized chip (see cde3346).
    walletChipText: {
      paddingRight: 2,
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    deletedText: {
      color: colors.muted,
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
  });

export default createStyles;
