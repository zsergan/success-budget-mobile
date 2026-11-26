import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    themeRow: {
      rowGap: scaleSpace(theme.spacing.md, layout) - 1,
      padding: scaleSpace(theme.spacing.md, layout) + 2,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(3, layout),
    },
    rowLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      color: colors.text,
    },
    rowSub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    // Three options in a row break "System" mid-word at accessibility sizes; they stack instead.
    themeSwitch: {
      minHeight: 44,
      borderRadius: 15,
      padding: scaleSpace(4, layout),
      flexDirection: layout.isAccessibilityText ? 'column' : 'row',
      columnGap: scaleSpace(4, layout),
      rowGap: scaleSpace(4, layout),
      backgroundColor: colors.track,
    },
    themeTab: {
      flex: layout.isAccessibilityText ? undefined : 1,
      paddingVertical: layout.isAccessibilityText ? scaleSpace(theme.spacing.sm, layout) : 0,
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
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
    themeTabTextActive: {
      color: colors.text,
    },
  });

export default createStyles;
