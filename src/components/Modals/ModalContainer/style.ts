import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    absolute: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    pressable: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    dark: {
      backgroundColor: colors.scrim,
    },
  });

export default createStyles;
