import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    iconCellWrap: {
      width: `${100 / 6}%`,
      aspectRatio: 1,
      marginBottom: scaleSpace(9, layout),
      paddingHorizontal: scaleSpace(4.5, layout),
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
