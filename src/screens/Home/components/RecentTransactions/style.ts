import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    title: {
      marginTop: scaleSpace(26, layout),
    },
    section: {
      marginTop: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(theme.spacing.md, layout),
    },
    rows: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    empty: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
    loadingContainer: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Grows with its label under large text instead of clipping it.
    history: {
      minHeight: 50,
      paddingVertical: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    historyText: {
      flexShrink: 1,
      paddingRight: 2,
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
  });

export default createStyles;
