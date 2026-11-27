import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.radius.lg - 4,
      padding: theme.spacing.md + 2,
      rowGap: theme.spacing.sm + 2,
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
      columnGap: theme.spacing.sm + 2,
      rowGap: theme.spacing.xs,
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
      rowGap: 3,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.xs + 3,
    },
    name: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      letterSpacing: -0.1,
      color: colors.text,
    },
    groupBadge: {
      minHeight: 18,
      paddingHorizontal: 6,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    groupBadgeText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 10,
      letterSpacing: 0.3,
      color: colors.muted,
    },
    sub: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
    amountBlock: layout.isLargeText
      ? { width: '100%', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 6 }
      : { alignItems: 'flex-end', rowGap: 3 },
    spent: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      letterSpacing: -0.2,
      color: colors.text,
    },
    cap: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      color: colors.muted,
    },
    bottomRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.xs,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
    },
    statusText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
    },
    paceText: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.micro,
      color: colors.muted,
    },
  });

export default createStyles;
