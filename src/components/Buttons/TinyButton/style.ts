import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import { fitHeight } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      columnGap: theme.spacing.xs,
      alignItems: 'center',
    },
    filledButton: {
      paddingHorizontal: theme.spacing.md,
      backgroundColor: colors.track,
      borderRadius: 11,
    },
    // Sized by the taller of the label and the icon circle, so an icon-only button keeps its height too.
    smButton: {
      ...fitHeight(32, Math.max(theme.lineHeights.caption, 16)),
    },
    mdButton: {
      ...fitHeight(40, Math.max(theme.lineHeights.label, 24)),
    },
    lgButton: {
      width: 34,
      height: 34,
      minHeight: 0,
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderRadius: 12,
      justifyContent: 'center',
    },
    selected: {
      backgroundColor: colors.accent,
    },
    disabled: {
      opacity: 0.3,
    },
    circle: {
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    smCircle: {
      width: 16,
      height: 16,
    },
    mdCircle: {
      width: 24,
      height: 24,
    },
    lgCircle: {
      width: 24,
      height: 24,
    },
    smTitle: {
      // Plus Jakarta Sans under-measures; see cde3346.
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    mdTitle: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    lgTitle: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
      color: colors.text,
    },
    plainTitle: {
      color: colors.muted,
    },
  });

export default createStyles;
