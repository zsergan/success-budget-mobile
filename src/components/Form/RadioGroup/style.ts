import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = (_: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      marginHorizontal: -screenPadding(layout),
    },
    container: {
      paddingHorizontal: screenPadding(layout),
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaleSpace(theme.spacing.sm, layout),
    },
  });

export default createStyles;
