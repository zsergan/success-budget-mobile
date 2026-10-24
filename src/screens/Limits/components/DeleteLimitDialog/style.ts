import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    // A group's categories, up to four, in one tile.
    tile: {
      width: 40,
      height: 40,
      borderRadius: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 1,
      rowGap: 1,
      padding: 4,
      backgroundColor: colors.track,
    },
  });

export default createStyles;
