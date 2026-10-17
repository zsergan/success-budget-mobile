import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      width: '100%',
      height: 1,
      backgroundColor: colors.hairline,
    },
  });

export default createStyles;
