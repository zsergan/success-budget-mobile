import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { sectionLabel } from '../sectionStyle';

// The digits step down as they grow, so the largest amount still fits on one line beside the currency.
const LARGEST_AMOUNT_FONT_SIZE = 44;
export const amountFontSize = (value: string) =>
  value.length > 9 ? 30 : value.length > 6 ? 36 : LARGEST_AMOUNT_FONT_SIZE;

// Bold's + and − both advance 0.66 em; the slot fits them at the largest tier, so no tier or sign moves the digits.
export const signSlotWidth = (fontScale: number) => Math.ceil(0.66 * LARGEST_AMOUNT_FONT_SIZE * fontScale);

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.xs,
    },
    label: sectionLabel(colors),
    row: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 3,
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
      height: 54,
      padding: 0,
      fontFamily: theme.fonts.bold,
      letterSpacing: -1.3,
    },
    currency: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 17,
      letterSpacing: 0.2,
      color: colors.muted,
      paddingRight: 2,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.danger,
    },
  });

export default createStyles;
