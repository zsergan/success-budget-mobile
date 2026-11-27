import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding } from '@shared/layout';
import theme from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      paddingHorizontal: screenPadding(layout),
      rowGap: theme.spacing.md,
      backgroundColor: colors.bg,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: FAB_SCROLL_CLEARANCE,
    },
    banner: {
      marginTop: theme.spacing.md,
    },
  });

export default createStyles;
