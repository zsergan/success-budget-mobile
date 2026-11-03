import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.lg,
    },
    card: {
      rowGap: theme.spacing.md,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      backgroundColor: colors.surface,
      ...elevation.card,
    },
    spaceName: {
      width: '100%',
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.titleMd,
      lineHeight: theme.lineHeights.titleMd,
      letterSpacing: theme.letterSpacing.titleMd,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
    },
    rowLabel: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    rowValue: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.text,
      textAlign: 'right',
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
  });

export default createStyles;
