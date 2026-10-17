import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    title: {
      marginTop: 26,
    },
    section: {
      marginTop: 14,
    },
    confirmContainer: {
      alignItems: 'center',
      rowGap: theme.spacing.sm,
    },
    confirmText: {
      fontFamily: theme.fonts.regular,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    confirmError: {
      paddingHorizontal: theme.spacing.lg,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      textAlign: 'center',
      color: colors.danger,
    },
    longPressedItem: {
      width: '100%',
    },
    loadingContainer: {
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default createStyles;
