import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      minHeight: 60,
      borderRadius: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md + 2,
      paddingVertical: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.faint,
    },
    loading: {
      justifyContent: 'center',
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    texts: {
      flex: 1,
      minWidth: 0,
      rowGap: 2,
    },
    title: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    retryButton: {
      height: 34,
      borderRadius: 11,
      paddingHorizontal: theme.spacing.md + 1,
      justifyContent: 'center',
      backgroundColor: colors.secondary,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    retryText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.onSecondary,
    },
  });

export default createStyles;
