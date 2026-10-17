import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

import { CHART_HEIGHT } from '../TrendChart/style';

const CARD_MIN_HEIGHT = 188;

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      marginTop: 22,
      rowGap: 10,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      letterSpacing: -0.2,
      color: colors.text,
    },
    step: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      color: colors.muted,
    },
    card: {
      minHeight: CARD_MIN_HEIGHT,
      paddingTop: 14,
      paddingHorizontal: 14,
      paddingBottom: 12,
      rowGap: 12,
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
      columnGap: 10,
      rowGap: 4,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 14,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
    },
    swatch: {
      width: 9,
      height: 9,
      borderRadius: 3,
    },
    legendText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      color: colors.muted,
    },
    max: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
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
