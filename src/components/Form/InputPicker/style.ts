import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.xs,
    },
    inputContainer: {
      height: 52,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: colors.surface,
    },
    input: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      color: colors.text,
    },
    placeholder: {
      color: colors.muted,
    },
    inputWithShadow: { ...elevation.card },
    outlinedValue: {
      lineHeight: 20,
    },
    label: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    container: {
      flex: 1,
      width: '100%',
      paddingHorizontal: theme.spacing.xl,
      justifyContent: 'flex-end',
      marginBottom: 28,
    },
    contentContainer: {
      backgroundColor: colors.bg,
      borderRadius: theme.radius.sm,
    },
    // iOS draws the wheel's rows in black unless told otherwise.
    pickerItem: {
      color: colors.text,
    },
  });

export default createStyles;
