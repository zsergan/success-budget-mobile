import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding } from '@shared/layout';

const createStyles = (_: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    banner: {
      paddingHorizontal: screenPadding(layout),
    },
  });

export default createStyles;
