import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    themeRow: {
      rowGap: theme.spacing.md - 1,
      padding: theme.spacing.md + 2,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      rowGap: 3,
    },
    rowLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      color: colors.text,
    },
    rowSub: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    // Three options in a row break "System" mid-word at accessibility sizes; they stack instead.
    themeSwitch: {
      minHeight: 44,
      borderRadius: 15,
      padding: 4,
      flexDirection: layout.isAccessibilityText ? 'column' : 'row',
      columnGap: 4,
      rowGap: 4,
      backgroundColor: colors.track,
    },
    themeTab: {
      flex: layout.isAccessibilityText ? undefined : 1,
      paddingVertical: layout.isAccessibilityText ? theme.spacing.sm : 0,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeTabActive: {
      backgroundColor: colors.elevated,
      ...elevation.segment,
    },
    themeTabText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.muted,
    },
    themeTabTextActive: {
      color: colors.text,
    },
  });

export default createStyles;
