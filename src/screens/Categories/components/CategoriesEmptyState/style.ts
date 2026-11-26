import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = (_: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    container: {
      marginTop: scaleSpace(theme.spacing.lg, layout),
      paddingHorizontal: screenPadding(layout),
    },
  });

export default createStyles;
