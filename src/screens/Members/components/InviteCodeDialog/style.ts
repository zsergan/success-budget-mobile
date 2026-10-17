import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    codeContainer: {
      alignItems: 'center',
      rowGap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    codeTitle: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      color: colors.text,
      textAlign: 'center',
    },
    code: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleLg,
      letterSpacing: 4,
      color: colors.accent,
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
      textAlign: 'center',
    },
  });

export default createStyles;
