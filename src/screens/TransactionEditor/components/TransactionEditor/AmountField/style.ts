import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { sectionLabel } from '../sectionStyle';

// The digits step down as they grow, so the largest amount still fits on one line beside the currency.
const LARGEST_AMOUNT_FONT_SIZE = 44;
export const amountFontSize = (value: string) =>
  value.length > 9 ? 30 : value.length > 6 ? 36 : LARGEST_AMOUNT_FONT_SIZE;

// Bold's + and − both advance 0.66 em; the slot fits them at the largest tier, so no tier or sign moves the digits.
export const signSlotWidth = (fontScale: number) => Math.ceil(0.66 * LARGEST_AMOUNT_FONT_SIZE * fontScale);

// The font's line box is 1.26 em: a UITextField shorter than that clips the digits and caret and shrinks the placeholder.
// Sized for the largest tier at the system text size, so stepping down a tier never moves the row.
const LINE_HEIGHT_EM = 1.26;
const CARET_ROOM = 2;
export const amountInputHeight = (fontScale: number) =>
  Math.ceil(LINE_HEIGHT_EM * LARGEST_AMOUNT_FONT_SIZE * fontScale) + CARET_ROOM;

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    label: sectionLabel(colors),
    row: {
      minHeight: 64,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(3, layout),
      borderBottomWidth: 1,
    },
    rowActive: {
      borderBottomWidth: 2,
    },
    // Plus Jakarta Sans under-measures its own width; a full-width text in a fixed slot keeps the glyph whole (see cde3346).
    sign: {
      width: '100%',
      fontFamily: theme.fonts.bold,
      textAlign: 'right',
    },
    input: {
      flex: 1,
      minWidth: 0,
      padding: 0,
      fontFamily: theme.fonts.bold,
      letterSpacing: -1.3,
    },
    currency: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(17, layout),
      letterSpacing: 0.2,
      color: colors.muted,
      paddingRight: 2,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
  });

export default createStyles;
