import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      paddingTop: scaleSpace(70, layout),
      paddingHorizontal: scaleSpace(12, layout),
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.lg, layout),
    },
    iconBox: {
      width: 64,
      height: 64,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    texts: {
      alignSelf: 'stretch',
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(19, layout),
      letterSpacing: -0.3,
      color: colors.text,
      textAlign: 'center',
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(13.5, layout),
      lineHeight: scaleFont(20, layout),
      color: colors.muted,
      textAlign: 'center',
    },
    action: {
      minHeight: 52,
      paddingHorizontal: scaleSpace(22, layout),
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(9, layout),
      backgroundColor: colors.accent,
    },
    actionText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(15, layout),
      color: colors.onAccent,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    note: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(12, layout),
      color: colors.muted,
    },
  });

export default createStyles;
