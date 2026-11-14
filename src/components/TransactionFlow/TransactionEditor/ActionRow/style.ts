import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    footer: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      rowGap: theme.spacing.sm,
      backgroundColor: colors.elevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.hairline,
    },
    helperText: {
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
  });

export default createStyles;
