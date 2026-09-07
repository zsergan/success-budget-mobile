import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    columnGap: theme.spacing.xs,
    alignItems: 'center',
  },
  filledButton: {
    paddingHorizontal: theme.spacing.md,
    backgroundColor: colors.track,
    borderRadius: 11,
  },
  smButton: {
    height: 32,
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
    // Plus Jakarta Sans under-measures; see cde3346.
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
  },
  mdTitle: {
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
  },
  plainTitle: {
    color: colors.muted,
  },
});

export default styles;
