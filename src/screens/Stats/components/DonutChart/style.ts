import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

import { DONUT_SIZE } from './donutGeometry';

const styles = StyleSheet.create({
  root: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignSelf: 'center',
  },
  svg: {
    ...StyleSheet.absoluteFill,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 30,
  },
  centerHead: {
    maxWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  centerLabel: {
    flexShrink: 1,
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    paddingRight: 2,
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
