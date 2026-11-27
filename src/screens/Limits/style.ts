import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    body: {
      flex: 1,
    },
    container: {
      paddingHorizontal: screenPadding(layout),
      paddingBottom: FAB_SCROLL_CLEARANCE,
      rowGap: scaleSpace(theme.spacing.lg, layout),
    },
    loadingContainer: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fab: {
      position: 'absolute',
      right: scaleSpace(theme.spacing.xl, layout),
      bottom: scaleSpace(theme.spacing.xxl, layout),
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
