import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    iconCellWrap: {
      width: `${100 / 6}%`,
      aspectRatio: 1,
      marginBottom: 9,
      paddingHorizontal: 4.5,
    },
    iconCell: {
      flex: 1,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCellUnselected: {
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    iconCellSelected: {
      borderWidth: 2,
    },
  });

export default createStyles;
