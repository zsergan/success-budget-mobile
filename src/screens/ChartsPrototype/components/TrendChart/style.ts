import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

export const BAR_AREA_HEIGHT = 104;
export const MIN_BAR_HEIGHT = 3;
export const PAIR_GAP = 2;
export const TOOLTIP_WIDTH = 150;
const FAINT = '#AAB2BE';

const styles = StyleSheet.create({
  root: {
    height: 136,
  },
  columns: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 5,
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
    backgroundColor: FAINT,
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.2,
    color: colors.muted,
  },
  labelCurrent: {
    color: colors.text,
  },
  sub: {
    fontFamily: theme.fonts.medium,
    fontSize: 9,
    lineHeight: 11,
    color: colors.muted,
  },
  future: {
    opacity: 0.42,
  },
  chart: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  hitArea: {
    flex: 1,
    alignSelf: 'stretch',
  },
  tooltip: {
    position: 'absolute',
    top: -4,
    width: TOOLTIP_WIDTH,
    zIndex: 5,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    gap: 5,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: colors.text,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 6,
  },
  tooltipTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltipSwatch: {
    width: 7,
    height: 7,
    borderRadius: 2,
  },
  tooltipLabel: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
  },
  tooltipValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});

export default styles;
