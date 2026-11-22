import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    header: {
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      rowGap: theme.spacing.md,
      backgroundColor: colors.bg,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: FAB_SCROLL_CLEARANCE,
    },
    banner: {
      marginTop: theme.spacing.md,
    },
  });

export default createStyles;
