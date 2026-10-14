import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    rowGap: 6,
  },
  title: {
    alignSelf: 'stretch',
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    letterSpacing: -0.1,
    textAlign: 'center',
    color: colors.text,
  },
  text: {
    alignSelf: 'stretch',
    fontFamily: theme.fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.muted,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
    height: 44,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.elevated,
  },
  buttonDimmed: {
    opacity: 0.6,
  },
  buttonLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    paddingRight: 2,
  },
});

export default styles;
