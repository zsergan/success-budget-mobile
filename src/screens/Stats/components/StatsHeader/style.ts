import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingTop: theme.spacing.md,
    paddingBottom: 14,
    paddingHorizontal: theme.spacing.xl,
    rowGap: 14,
    backgroundColor: colors.bg,
  },
  titleBlock: {
    rowGap: 2,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
    color: colors.text,
  },
  space: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
});

export default styles;
