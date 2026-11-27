import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    button: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    outlined: {
      minHeight: 48,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    buttonLocked: {
      opacity: 0.4,
    },
    text: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.danger,
    },
  });

export default createStyles;
