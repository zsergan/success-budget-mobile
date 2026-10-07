import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
  },
  textColumn: {
    flex: 1,
    rowGap: 2,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.text,
  },
  text: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  action: {
    minWidth: 44,
    alignItems: 'center',
  },
  // SemiBold under-measures its width in a content-sized label (see cde3346).
  actionText: {
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
    textDecorationLine: 'underline',
  },
});

export default styles;
