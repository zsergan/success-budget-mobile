import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    failure: {
      marginTop: -2,
      marginBottom: 22,
    },
    note: {
      marginBottom: 2,
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.muted,
    },
  });

export default createStyles;
