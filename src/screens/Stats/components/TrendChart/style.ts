import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

import { BAR_AREA_HEIGHT } from './trendAdapter';

export const CHART_HEIGHT = 136;
export const TOOLTIP_WIDTH = 150;

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      height: CHART_HEIGHT,
    },
    content: {
      height: CHART_HEIGHT,
    },
    columns: {
      ...StyleSheet.absoluteFill,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    column: {
      alignItems: 'center',
      gap: scaleSpace(5, layout),
      borderRadius: 8,
    },
    columnSelected: {
      backgroundColor: colors.track,
    },
    dimmed: {
      opacity: 0.3,
    },
    barArea: {
      height: BAR_AREA_HEIGHT,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    zeroMark: {
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.faint,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(9, layout),
      lineHeight: scaleFont(11, layout),
      letterSpacing: 0.2,
      color: colors.muted,
    },
    labelCurrent: {
      color: colors.text,
    },
    sub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(9, layout),
      lineHeight: scaleFont(11, layout),
      color: colors.muted,
      fontVariant: ['tabular-nums'],
    },
    future: {
      opacity: 0.42,
    },
    bars: {
      position: 'absolute',
      left: 0,
      top: 0,
    },
    hitArea: {
      alignSelf: 'stretch',
    },
    tooltip: {
      position: 'absolute',
      top: -4,
      width: TOOLTIP_WIDTH,
      zIndex: 5,
      borderRadius: 12,
      paddingVertical: scaleSpace(9, layout),
      paddingHorizontal: scaleSpace(11, layout),
      gap: scaleSpace(5, layout),
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.hairline,
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 14,
      elevation: 6,
    },
    tooltipTitle: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(11, layout),
      lineHeight: scaleFont(14, layout),
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    tooltipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: scaleSpace(6, layout),
    },
    tooltipSwatch: {
      width: 7,
      height: 7,
      borderRadius: 2,
    },
    tooltipLabel: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(11, layout),
      lineHeight: scaleFont(14, layout),
      color: colors.muted,
    },
    tooltipValue: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(11, layout),
      lineHeight: scaleFont(14, layout),
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
  });

export default createStyles;
