import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = (_: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    container: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: screenPadding(layout),
    },
    scroll: {
      paddingHorizontal: screenPadding(layout),
    },
    scrollContent: {
      paddingTop: theme.spacing.md,
    },
  });

export default createStyles;
