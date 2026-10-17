import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      rowGap: theme.spacing.sm,
    },
    spaceLine: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      color: colors.muted,
    },
    scrollContent: {
      rowGap: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
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
