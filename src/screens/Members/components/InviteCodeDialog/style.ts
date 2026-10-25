import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    codeContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    code: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleLg,
      lineHeight: theme.lineHeights.titleLg,
      letterSpacing: 4,
      color: colors.accent,
    },
  });

export default createStyles;
