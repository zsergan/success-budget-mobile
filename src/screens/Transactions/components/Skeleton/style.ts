import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      marginTop: theme.spacing.md,
      rowGap: theme.spacing.lg,
    },
    block: {
      borderRadius: 6,
      backgroundColor: colors.track,
    },
    group: {
      rowGap: theme.spacing.md,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    groupLabel: {
      width: 72,
      height: 9,
    },
    groupTotal: {
      width: 48,
      height: 9,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
    },
    textColumn: {
      flex: 1,
      rowGap: 7,
    },
    textLine: {
      height: 11,
      borderRadius: 6,
    },
    textLineSmall: {
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.hairline,
    },
    amount: {
      width: 56,
      height: 13,
    },
  });

export default createStyles;
