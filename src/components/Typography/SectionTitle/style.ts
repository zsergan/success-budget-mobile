import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  title: {
    // flexGrow: 1 so this Text's box comes from the row's own available-
    // space calculation, not from Yoga's own intrinsic measurement of the
    // string — Plus Jakarta Sans under-measures and clips the last glyph
    // otherwise, even with plenty of free space around it (see cde3346).
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
  },
});

export default styles;
