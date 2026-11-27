import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: theme.spacing.md,
      backgroundColor: colors.bg,
    },
    banner: {
      marginTop: theme.spacing.md,
    },
  });

export default createStyles;
