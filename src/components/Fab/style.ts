import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      // left/right: 0 + paddingRight gives a deterministic full-width box instead of Yoga's shrink-wrap under `right` alone.
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: scaleSpace(theme.spacing.xxl, layout),
      alignItems: 'flex-end',
      paddingRight: scaleSpace(theme.spacing.xl, layout),
    },
    fab: {
      width: 58,
      height: 58,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      ...elevation.fab,
    },
    menu: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
      marginBottom: scaleSpace(theme.spacing.md, layout) - 2,
      alignItems: 'flex-end',
    },
    menuItem: {
      minHeight: 44,
      borderRadius: theme.radius.md,
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 1,
      backgroundColor: colors.elevated,
      ...elevation.modal,
    },
    menuItemText: {
      // Plus Jakarta Sans under-measures; see cde3346.
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
  });

export default createStyles;
