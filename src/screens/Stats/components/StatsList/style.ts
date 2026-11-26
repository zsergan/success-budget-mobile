import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const CARD_RADIUS = 18;
export const BREAKDOWN_PLACEHOLDER_HEIGHT = 260;

// The donut and the rows are separate list items drawn as one card: the donut
// item opens it, every row carries its side borders and the last row closes it.
const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    list: {
      flex: 1,
    },
    content: {
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: screenPadding(layout),
      paddingBottom: scaleSpace(theme.spacing.xxl, layout),
    },
    cardTop: {
      paddingTop: scaleSpace(theme.spacing.lg, layout),
      paddingBottom: scaleSpace(14, layout),
      alignItems: 'center',
      borderTopLeftRadius: CARD_RADIUS,
      borderTopRightRadius: CARD_RADIUS,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    cardMiddle: {
      paddingHorizontal: scaleSpace(6, layout),
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    cardBottom: {
      paddingBottom: scaleSpace(theme.spacing.sm, layout),
      borderBottomWidth: 1,
      borderBottomLeftRadius: CARD_RADIUS,
      borderBottomRightRadius: CARD_RADIUS,
    },
    breakdownError: {
      minHeight: BREAKDOWN_PLACEHOLDER_HEIGHT,
    },
    emptyCard: {
      paddingVertical: scaleSpace(theme.spacing.xxl, layout),
      paddingHorizontal: screenPadding(layout),
      alignItems: 'center',
      rowGap: scaleSpace(10, layout),
      borderRadius: CARD_RADIUS,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    emptyIcon: {
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    emptyTitle: {
      alignSelf: 'stretch',
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(15, layout),
      color: colors.text,
    },
    emptyText: {
      alignSelf: 'stretch',
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.muted,
    },
  });

export default createStyles;
