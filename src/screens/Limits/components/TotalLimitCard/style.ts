import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      borderRadius: theme.radius.lg + 2,
      padding: theme.spacing.xl,
      rowGap: theme.spacing.md - 1,
      ...elevation.card,
    },
    gradient: {
      borderRadius: theme.radius.lg + 2,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
    },
    summary: {
      flex: 1,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      letterSpacing: 0.2,
    },
    amountRow: {
      marginTop: theme.spacing.xs + 2,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      columnGap: 7,
    },
    spent: {
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('display', 34, layout),
      letterSpacing: -1.4,
    },
    cap: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
    },
    editButton: {
      width: 32,
      minHeight: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressTrack: {
      height: 10,
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressFill: {
      height: 10,
      borderRadius: 6,
    },
    // The two figures sit at either end, and share the width or stack once they no longer fit side by side.
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.xs,
    },
    statText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
    },
    divider: {
      height: 1,
    },
    resetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm - 1,
    },
    resetText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.micro,
    },
  });

export default createStyles;
