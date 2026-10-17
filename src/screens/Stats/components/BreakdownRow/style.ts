import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    row: {
      paddingTop: 9,
      paddingBottom: 10,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.sm,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 11,
    },
    rowSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    rowChild: {
      paddingLeft: 26,
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
      rowGap: 5,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      columnGap: 10,
    },
    nameRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
    },
    name: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      letterSpacing: -0.1,
      color: colors.text,
    },
    nameMuted: {
      color: colors.muted,
    },
    archived: {
      height: 18,
      paddingHorizontal: 6,
      borderRadius: 6,
      overflow: 'hidden',
      fontFamily: theme.fonts.semiBold,
      fontSize: 10,
      lineHeight: 18,
      letterSpacing: 0.2,
      color: colors.muted,
      backgroundColor: colors.track,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      letterSpacing: -0.2,
      color: colors.text,
    },
    shareRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 9,
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
      fontSize: theme.fontSizes.micro,
      color: colors.muted,
    },
    chevron: {
      width: 13,
      height: 13,
    },
  });

export default createStyles;
