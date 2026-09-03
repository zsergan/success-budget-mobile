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
    // paddingRight buffer: Plus Jakarta Sans SemiBold's own intrinsic
    // measurement comes out a hair narrow (same bug as cde3346) — this
    // box auto-sizes from that measurement (it's a content-hugging chip,
    // can't just force a wide explicit box like on a full-width Text),
    // so give the glyphs a little extra room directly.
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
