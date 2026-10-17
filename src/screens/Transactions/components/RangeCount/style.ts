import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    row: {
      minHeight: theme.lineHeights.bodySm,
      marginTop: theme.spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: theme.spacing.sm,
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    retry: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.text,
    },
  });

export default createStyles;
