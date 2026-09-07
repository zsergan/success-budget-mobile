import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    columnGap: theme.spacing.sm + 1,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    rowGap: theme.spacing.sm - 1,
  },
  text: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.text,
  },
  bar: {
    height: 7,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.track,
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  footer: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
});

export default styles;
