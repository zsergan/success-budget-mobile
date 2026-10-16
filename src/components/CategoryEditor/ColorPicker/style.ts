import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    colorRow: {
      flexDirection: 'row',
      columnGap: theme.spacing.sm,
    },
    colorSwatch: {
      flex: 1,
      height: 44,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorSwatchSelected: {
      borderWidth: 2,
      borderColor: colors.text,
    },
  });

export default createStyles;
