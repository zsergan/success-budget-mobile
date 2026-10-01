import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

export const DONUT_SIZE = 150;
export const RADIUS = 68;
export const INNER_RADIUS = 48;
export const SEGMENT_GAP = 3;
export const SELECTED_GROWTH = 3;

const styles = StyleSheet.create({
  root: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 30,
  },
  centerLabel: {
    maxWidth: 96,
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  centerAmount: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.5,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  centerSub: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    lineHeight: 13,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
  },
});

export default styles;
