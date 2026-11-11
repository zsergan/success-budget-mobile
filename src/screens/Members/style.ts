import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      rowGap: theme.spacing.sm,
    },
    // Fills the screen's height, so a short list leaves the room above the leave section.
    scrollContent: {
      flexGrow: 1,
      rowGap: theme.spacing.xl,
    },
    content: {
      flexGrow: 1,
      rowGap: theme.spacing.xxl,
      paddingBottom: theme.spacing.xl,
    },
    main: {
      flexGrow: 1,
      rowGap: theme.spacing.xl,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: theme.spacing.sm,
      paddingVertical: theme.spacing.xl,
    },
    errorText: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      color: colors.muted,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: theme.spacing.md,
    },
  });

export default createStyles;
