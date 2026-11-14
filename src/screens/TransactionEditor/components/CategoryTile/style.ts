import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    cell: {
      paddingHorizontal: theme.spacing.xs,
      marginBottom: theme.spacing.md,
      alignItems: 'center',
      rowGap: 6,
    },
    box: {
      width: 54,
      height: 54,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    boxSelected: {
      borderWidth: 2,
    },
    boxAction: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
    },
    name: {
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: 15,
      color: colors.muted,
    },
    nameSelected: {
      fontFamily: theme.fonts.bold,
      color: colors.text,
    },
    badge: {
      position: 'absolute',
      bottom: -7,
      height: 14,
      borderRadius: 5,
      paddingHorizontal: 5,
      justifyContent: 'center',
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    badgeText: {
      paddingRight: 1,
      fontFamily: theme.fonts.bold,
      fontSize: 8,
      lineHeight: 11,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.muted,
    },
  });

export default createStyles;
