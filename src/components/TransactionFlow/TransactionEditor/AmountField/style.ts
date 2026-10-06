import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

export const AMOUNT_FONT = { max: 40, min: 28 };

const styles = StyleSheet.create({
  root: {
    marginHorizontal: theme.spacing.xl,
    rowGap: theme.spacing.xs,
  },
  row: {
    height: 68,
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
    fontFamily: theme.fonts.semiBold,
    letterSpacing: -1.2,
    paddingRight: 2,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: 52,
    padding: 0,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: -1.2,
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

export default styles;
