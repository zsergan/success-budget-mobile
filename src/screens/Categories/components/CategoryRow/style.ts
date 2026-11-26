import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
      padding: scaleSpace(theme.spacing.md, layout),
      borderRadius: theme.radius.md + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    rowArchived: {
      backgroundColor: 'transparent',
    },
    rowActive: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
    },
    textContainer: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(3, layout),
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) - 2,
    },
    name: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout) - 1,
      color: colors.text,
    },
    nameArchived: {
      color: colors.muted,
    },
    limitPill: {
      minHeight: 19,
      paddingHorizontal: scaleSpace(7, layout),
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    limitPillText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(10, layout),
      color: colors.muted,
    },
    meta: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    trailing: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    restorePill: {
      minHeight: 30,
      paddingHorizontal: scaleSpace(theme.spacing.sm, layout) + 2,
      borderRadius: theme.radius.md - 3,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(5, layout),
      backgroundColor: colors.track,
    },
    restorePillText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.text,
    },
  });

export default createStyles;
