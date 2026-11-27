import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.radius.lg - 4,
      padding: scaleSpace(theme.spacing.md, layout) + 2,
      rowGap: scaleSpace(theme.spacing.sm, layout) + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    cardOver: {
      borderColor: hexToRgba(colors.danger, 0.32),
    },
    // Under large text the amounts drop below the name, which would otherwise break mid-word.
    topRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 2,
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    iconBox: {
      width: 42,
      height: 42,
      flexShrink: 0,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniIconGrid: {
      width: 32,
      height: 32,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    miniIconCell: {
      width: '50%',
      height: '50%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(3, layout),
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.xs, layout) + 3,
    },
    name: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      letterSpacing: -0.1,
      color: colors.text,
    },
    groupBadge: {
      minHeight: 18,
      paddingHorizontal: scaleSpace(6, layout),
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    groupBadgeText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(10, layout),
      letterSpacing: 0.3,
      color: colors.muted,
    },
    sub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    amountBlock: layout.isLargeText
      ? { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6 }
      : { alignItems: 'flex-end', rowGap: 3 },
    spent: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      letterSpacing: -0.2,
      color: colors.text,
    },
    cap: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    bottomRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
    },
    statusText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
    },
    paceText: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
  });

export default createStyles;
