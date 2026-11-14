import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { sectionLabel } from '../sectionStyle';

// The digits step down as they grow, so the largest amount still fits on one line beside the currency.
export const amountFontSize = (value: string) => (value.length > 9 ? 30 : value.length > 6 ? 36 : 44);

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
    // SemiBold under-measures its width in a content-sized text (see cde3346).
    sign: {
      fontFamily: theme.fonts.bold,
      letterSpacing: -1.3,
      paddingRight: 2,
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
