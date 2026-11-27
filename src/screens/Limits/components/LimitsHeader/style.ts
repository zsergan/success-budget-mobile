import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingTop: theme.spacing.md,
      paddingHorizontal: screenPadding(layout),
      paddingBottom: theme.spacing.md,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: theme.spacing.md,
      rowGap: theme.spacing.sm,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleLg', layout),
      letterSpacing: theme.letterSpacing.titleLg,
      color: colors.text,
    },
    periodPill: {
      minHeight: 32,
      paddingHorizontal: theme.spacing.md - 1,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm - 1,
      backgroundColor: colors.track,
    },
    periodMonth: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.text,
    },
    periodDivider: {
      width: 1,
      height: 12,
      backgroundColor: colors.hairline,
    },
    periodDays: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
  });

export default createStyles;
