import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace } from '@shared/layout';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
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
      padding: scaleSpace(4, layout),
      backgroundColor: colors.track,
    },
  });

export default createStyles;
