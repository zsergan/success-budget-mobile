import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      marginTop: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(theme.spacing.lg, layout),
    },
    block: {
      borderRadius: 6,
      backgroundColor: colors.track,
    },
    group: {
      rowGap: scaleSpace(theme.spacing.md, layout),
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
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
    },
    textColumn: {
      flex: 1,
      rowGap: scaleSpace(7, layout),
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
