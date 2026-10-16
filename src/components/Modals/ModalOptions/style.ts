import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    options: {
      marginTop: theme.spacing.sm,
      marginHorizontal: theme.spacing.xl,
      backgroundColor: colors.elevated,
      borderRadius: theme.radius.sm,
      ...elevation.card,
    },
    option: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      flexDirection: 'row',
      columnGap: theme.spacing.xxl,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    text: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      color: colors.text,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.muted,
    },
  });

export default createStyles;
