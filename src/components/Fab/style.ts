import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    root: {
      // left/right: 0 + paddingRight gives a deterministic full-width box instead of Yoga's shrink-wrap under `right` alone.
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: theme.spacing.xxl,
      alignItems: 'flex-end',
      paddingRight: theme.spacing.xl,
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
      rowGap: theme.spacing.sm,
      marginBottom: theme.spacing.md - 2,
      alignItems: 'flex-end',
    },
    menuItem: {
      height: 44,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm + 1,
      backgroundColor: colors.elevated,
      ...elevation.modal,
    },
    menuItemText: {
      // Plus Jakarta Sans under-measures; see cde3346.
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
  });

export default createStyles;
