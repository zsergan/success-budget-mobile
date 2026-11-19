import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    initial: {
      fontFamily: theme.fonts.bold,
    },
    space: {
      backgroundColor: hexToRgba(colors.accent, 0.2),
    },
    imported: {
      backgroundColor: colors.track,
    },
    outlined: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.faint,
    },
  });

export default createStyles;
