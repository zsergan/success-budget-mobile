import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = (_: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    container: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: screenPadding(layout),
    },
    scroll: {
      paddingHorizontal: screenPadding(layout),
    },
    scrollContent: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
    },
  });

export default createStyles;
