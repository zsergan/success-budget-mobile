import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    button: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: theme.spacing.sm,
    },
    outlined: {
      height: 48,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    buttonLocked: {
      opacity: 0.4,
    },
    text: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.danger,
    },
  });

export default createStyles;
