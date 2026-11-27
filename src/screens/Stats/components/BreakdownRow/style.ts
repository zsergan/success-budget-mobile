import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    row: {
      paddingTop: scaleSpace(9, layout),
      paddingBottom: scaleSpace(10, layout),
      paddingHorizontal: scaleSpace(theme.spacing.sm, layout),
      borderRadius: theme.radius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(11, layout),
    },
    rowSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    rowChild: {
      paddingLeft: scaleSpace(26, layout),
    },
    rowPressed: {
      backgroundColor: colors.track,
    },
    rowSelected: {
      backgroundColor: colors.track,
    },
    rowDimmed: {
      opacity: 0.45,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(5, layout),
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      columnGap: scaleSpace(10, layout),
    },
    nameRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
    },
    name: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      letterSpacing: -0.1,
      color: colors.text,
    },
    nameMuted: {
      color: colors.muted,
    },
    archived: {
      minHeight: 18,
      paddingHorizontal: scaleSpace(6, layout),
      borderRadius: 6,
      overflow: 'hidden',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(10, layout),
      lineHeight: scaleFont(18, layout),
      letterSpacing: 0.2,
      color: colors.muted,
      backgroundColor: colors.track,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      letterSpacing: -0.2,
      color: colors.text,
    },
    shareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(9, layout),
    },
    track: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: colors.track,
    },
    fill: {
      height: 4,
      borderRadius: 2,
    },
    percent: {
      minWidth: 40,
      textAlign: 'right',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    chevron: {
      width: 13,
      height: 13,
    },
  });

export default createStyles;
