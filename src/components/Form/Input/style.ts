import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { fitHeight, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

// The focused and error borders are the widest; the field stays 52 tall with either.
const WIDEST_BORDER = 1.5;

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    input: {
      ...fitHeight(52, scaleFont(theme.lineHeights.bodyLg, layout), WIDEST_BORDER),
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
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
      paddingLeft: scaleSpace(theme.spacing.lg, layout) + 32 + scaleSpace(theme.spacing.md, layout),
    },
    inputWithRightIcon: {
      paddingRight: scaleSpace(theme.spacing.lg, layout) + 32 + scaleSpace(theme.spacing.md, layout),
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
      left: scaleSpace(theme.spacing.xl, layout),
    },
    iconRight: {
      right: scaleSpace(theme.spacing.xl, layout),
    },
    label: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
  });

export default createStyles;
