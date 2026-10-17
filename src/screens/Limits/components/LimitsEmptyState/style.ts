import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    emptyBlock: {
      marginTop: theme.spacing.lg,
      rowGap: theme.spacing.lg,
    },
    rules: {
      rowGap: theme.spacing.sm + 1,
    },
    ruleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: theme.spacing.sm,
    },
    ruleText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
  });

export default createStyles;
