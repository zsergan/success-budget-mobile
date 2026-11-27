import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
      padding: scaleSpace(theme.spacing.md, layout),
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
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    titleFailed: {
      color: colors.danger,
    },
    detail: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    actions: {
      alignItems: 'flex-end',
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    link: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.accent,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    linkDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
