import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

import { CHART_HEIGHT } from '../TrendChart/style';

const CARD_MIN_HEIGHT = 188;

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      marginTop: scaleSpace(22, layout),
      rowGap: scaleSpace(10, layout),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      letterSpacing: -0.2,
      color: colors.text,
    },
    step: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    card: {
      minHeight: CARD_MIN_HEIGHT,
      paddingTop: scaleSpace(14, layout),
      paddingHorizontal: scaleSpace(14, layout),
      paddingBottom: scaleSpace(12, layout),
      rowGap: scaleSpace(12, layout),
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(10, layout),
      rowGap: scaleSpace(4, layout),
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(14, layout),
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
    },
    swatch: {
      width: 9,
      height: 9,
      borderRadius: 3,
    },
    legendText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    max: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
      fontVariant: ['tabular-nums'],
    },
    sample: {
      opacity: 0,
    },
    chartArea: {
      height: CHART_HEIGHT,
    },
    fill: {
      flex: 1,
    },
  });

export default createStyles;
