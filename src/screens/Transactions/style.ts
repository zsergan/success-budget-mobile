import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
      backgroundColor: colors.bg,
    },
    banner: {
      marginTop: theme.spacing.md,
    },
  });

export default createStyles;
