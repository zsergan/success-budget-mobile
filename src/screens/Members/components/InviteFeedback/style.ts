import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    cardFailed: {
      borderColor: `${colors.danger}55`,
    },
    text: {
      flex: 1,
      minWidth: 0,
      rowGap: 2,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    titleFailed: {
      color: colors.danger,
    },
    detail: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    actions: {
      alignItems: 'flex-end',
      rowGap: theme.spacing.xs,
    },
    link: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.accent,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    linkDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
