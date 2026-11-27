import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = (_: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    container: {
      marginTop: theme.spacing.lg,
      paddingHorizontal: screenPadding(layout),
    },
  });

export default createStyles;
