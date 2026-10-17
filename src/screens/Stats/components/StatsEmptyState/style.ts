import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    emphasis: {
      fontFamily: theme.fonts.semiBold,
      color: colors.text,
    },
  });

export default createStyles;
