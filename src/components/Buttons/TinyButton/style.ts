import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { fitHeight, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.xs, layout),
      alignItems: 'center',
    },
    filledButton: {
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      backgroundColor: colors.track,
      borderRadius: 11,
    },
    // Sized by the taller of the label and the icon circle, so an icon-only button keeps its height too.
    smButton: {
      ...fitHeight(32, Math.max(scaleFont(theme.lineHeights.caption, layout), 16)),
    },
    mdButton: {
      ...fitHeight(40, Math.max(scaleFont(theme.lineHeights.label, layout), 24)),
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
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    mdTitle: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    lgTitle: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    plainTitle: {
      color: colors.muted,
    },
  });

export default createStyles;
