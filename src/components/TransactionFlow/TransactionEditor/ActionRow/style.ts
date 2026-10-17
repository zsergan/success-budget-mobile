import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    footer: {
      marginTop: theme.spacing.md,
      marginHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
      rowGap: theme.spacing.sm,
    },
    helperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 6,
    },
    helperText: {
      flexShrink: 1,
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    saveButton: {
      minHeight: 54,
      paddingVertical: theme.spacing.md,
      borderRadius: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 9,
      backgroundColor: colors.track,
    },
    saveButtonReady: {
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 12 },
      shadowRadius: 24,
    },
    saveButtonText: {
      flexShrink: 1,
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      letterSpacing: -0.1,
      color: colors.muted,
    },
  });

export default createStyles;
