import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: theme.spacing.sm,
    },
    leaveButton: {
      height: 52,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: theme.spacing.sm + 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: `${colors.danger}66`,
    },
    leaveButtonDisabled: {
      opacity: 0.5,
    },
    leaveButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.danger,
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
  });

export default createStyles;
