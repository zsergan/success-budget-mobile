import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      width: '100%',
      paddingHorizontal: theme.spacing.xl,
      justifyContent: 'flex-end',
      marginBottom: 34,
    },
    contentContainer: {
      backgroundColor: colors.elevated,
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: theme.spacing.md,
    },
    content: {
      marginBottom: theme.spacing.md,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.track,
    },
    action: {
      width: '100%',
    },
    cancel: {
      marginTop: theme.spacing.sm,
    },
  });

export default createStyles;
