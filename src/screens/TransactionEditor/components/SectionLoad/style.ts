import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      minHeight: 60,
      borderRadius: scaleSpace(theme.spacing.lg, layout),
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
      paddingVertical: scaleSpace(theme.spacing.md, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
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
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    retryButton: {
      minHeight: 34,
      borderRadius: 11,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 1,
      justifyContent: 'center',
      backgroundColor: colors.secondary,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    retryText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.onSecondary,
    },
  });

export default createStyles;
