import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    padding: theme.spacing.sm,
    backgroundColor: colors.track,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    columnGap: theme.spacing.xs,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: colors.accent,
  },
  disabled: {
    opacity: 0.3,
  },
  smTitle: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
  },
  mdTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
  },
});

export default styles;
