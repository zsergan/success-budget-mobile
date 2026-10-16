import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme, { horizontalScreenPadding } from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xxl,
      paddingHorizontal: horizontalScreenPadding,
      backgroundColor: colors.secondary,
    },
    container: {
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    text: {
      maxWidth: '80%',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      color: colors.onSecondary,
    },
  });

export default createStyles;
