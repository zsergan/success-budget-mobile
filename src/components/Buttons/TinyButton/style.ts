import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.track,
    borderRadius: 11,
    flexDirection: 'row',
    columnGap: theme.spacing.xs,
    alignItems: 'center',
  },
  smButton: {
    height: 34,
  },
  mdButton: {
    height: 40,
  },
  selected: {
    backgroundColor: colors.accent,
  },
  disabled: {
    opacity: 0.3,
  },
  circle: {
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smCircle: {
    width: 16,
    height: 16,
  },
  mdCircle: {
    width: 24,
    height: 24,
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
