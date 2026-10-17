import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    body: {
      flex: 1,
    },
    container: {
      paddingHorizontal: theme.spacing.xl,
      paddingBottom: FAB_SCROLL_CLEARANCE,
      rowGap: theme.spacing.lg,
    },
    loadingContainer: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.xl,
      bottom: theme.spacing.xxl,
      width: 58,
      height: 58,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      ...elevation.fab,
    },
  });

export default createStyles;
