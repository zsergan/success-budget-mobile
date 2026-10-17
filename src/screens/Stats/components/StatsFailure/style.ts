import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      paddingTop: 70,
      paddingHorizontal: 12,
      alignItems: 'center',
      rowGap: theme.spacing.lg,
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
      rowGap: theme.spacing.sm,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 19,
      letterSpacing: -0.3,
      color: colors.text,
      textAlign: 'center',
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: 13.5,
      lineHeight: 20,
      color: colors.muted,
      textAlign: 'center',
    },
    action: {
      height: 52,
      paddingHorizontal: 22,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 9,
      backgroundColor: colors.accent,
    },
    actionText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 15,
      color: colors.onAccent,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    note: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 12,
      color: colors.muted,
    },
  });

export default createStyles;
