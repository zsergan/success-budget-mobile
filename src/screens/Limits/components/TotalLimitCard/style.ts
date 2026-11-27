import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      borderRadius: theme.radius.lg + 2,
      padding: scaleSpace(theme.spacing.xl, layout),
      rowGap: scaleSpace(theme.spacing.md, layout) - 1,
      ...elevation.card,
    },
    gradient: {
      borderRadius: theme.radius.lg + 2,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    summary: {
      flex: 1,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      letterSpacing: 0.2,
    },
    amountRow: {
      marginTop: scaleSpace(theme.spacing.xs, layout) + 2,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'baseline',
      columnGap: scaleSpace(7, layout),
    },
    spent: {
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('display', scaleFont(34, layout, 1), layout),
      letterSpacing: -1.4,
    },
    cap: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
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
      columnGap: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    statText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
    },
    divider: {
      height: 1,
    },
    resetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) - 1,
    },
    resetText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
    },
  });

export default createStyles;
