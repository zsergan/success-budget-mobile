import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    cell: {
      paddingHorizontal: scaleSpace(theme.spacing.xs, layout),
      marginBottom: scaleSpace(theme.spacing.md, layout),
      alignItems: 'center',
      rowGap: scaleSpace(6, layout),
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
    boxCategory: {
      borderWidth: 0,
    },
    boxSelected: {
      borderWidth: 2,
      borderColor: colors.text,
    },
    check: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text,
      borderWidth: 2,
      borderColor: colors.bg,
    },
    boxAction: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
    },
    name: {
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(15, layout),
      color: colors.muted,
    },
    nameSelected: {
      fontFamily: theme.fonts.bold,
      color: colors.text,
    },
    badge: {
      position: 'absolute',
      bottom: -7,
      minHeight: 14,
      borderRadius: 5,
      paddingHorizontal: scaleSpace(5, layout),
      justifyContent: 'center',
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    badgeText: {
      paddingRight: 1,
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(8, layout),
      lineHeight: scaleFont(11, layout),
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.muted,
    },
  });

export default createStyles;
