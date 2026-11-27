import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      paddingBottom: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(4, layout),
    },
    title: {
      fontFamily: theme.fonts.bold,
      ...textRole('titleSm', layout),
      color: colors.text,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
    section: {
      paddingHorizontal: screenPadding(layout),
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingBottom: scaleSpace(4, layout),
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    row: {
      minHeight: 56,
      paddingHorizontal: screenPadding(layout),
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    texts: {
      flex: 1,
      minWidth: 0,
      rowGap: 1,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    sub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
  });

export default createStyles;
