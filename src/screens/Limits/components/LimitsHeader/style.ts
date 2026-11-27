import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    header: {
      paddingTop: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: screenPadding(layout),
      paddingBottom: scaleSpace(theme.spacing.md, layout),
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleLg', layout),
      letterSpacing: theme.letterSpacing.titleLg,
      color: colors.text,
    },
    periodPill: {
      minHeight: 32,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) - 1,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) - 1,
      backgroundColor: colors.track,
    },
    periodMonth: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.text,
    },
    periodDivider: {
      width: 1,
      height: 12,
      backgroundColor: colors.hairline,
    },
    periodDays: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
  });

export default createStyles;
