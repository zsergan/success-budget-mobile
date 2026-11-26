import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import { fitHeight } from '@shared/layout';
import theme from '@shared/theme';

// The focused and error borders are the widest; the field stays 52 tall with either.
const WIDEST_BORDER = 1.5;

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.xs,
    },
    input: {
      ...fitHeight(52, theme.lineHeights.bodyLg, WIDEST_BORDER),
      paddingHorizontal: theme.spacing.lg,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      // Plus Jakarta Sans Medium collapses the space between words here; see cde3346.
      letterSpacing: 0.2,
      color: colors.text,
      borderRadius: theme.radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    focused: {
      borderWidth: WIDEST_BORDER,
      borderColor: colors.accent,
    },
    withError: {
      borderWidth: WIDEST_BORDER,
      borderColor: colors.danger,
    },
    disabledInput: {
      backgroundColor: colors.track,
      color: colors.muted,
    },
    inputWithLeftIcon: {
      paddingLeft: theme.spacing.lg + 32 + theme.spacing.md,
    },
    inputWithRightIcon: {
      paddingRight: theme.spacing.lg + 32 + theme.spacing.md,
    },
    inputWithShadow: { ...elevation.card },
    // Fills the box's height so a tap anywhere in it focuses the field.
    outlinedInput: {
      alignSelf: 'stretch',
      paddingVertical: 0,
    },
    icon: {
      position: 'absolute',
      top: 0,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      zIndex: 1,
    },
    iconLeft: {
      left: theme.spacing.xl,
    },
    iconRight: {
      right: theme.spacing.xl,
    },
    label: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.danger,
    },
  });

export default createStyles;
