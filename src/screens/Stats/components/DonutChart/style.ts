import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

import { DONUT_SIZE } from './donutGeometry';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
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
      paddingHorizontal: scaleSpace(30, layout),
    },
    centerHead: {
      maxWidth: 96,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(4, layout),
    },
    centerLabel: {
      flexShrink: 1,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(10, layout),
      lineHeight: scaleFont(13, layout),
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    centerAmount: {
      alignSelf: 'stretch',
      textAlign: 'center',
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(19, layout),
      lineHeight: scaleFont(24, layout),
      letterSpacing: -0.5,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    centerSub: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(10, layout),
      lineHeight: scaleFont(13, layout),
      color: colors.muted,
      fontVariant: ['tabular-nums'],
    },
  });

export default createStyles;
