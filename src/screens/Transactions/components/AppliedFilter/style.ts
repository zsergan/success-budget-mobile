import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.md,
    borderRadius: 14,
    paddingVertical: 11,
    paddingLeft: 11,
    paddingRight: theme.spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  body: {
    flex: 1,
    rowGap: 2,
  },
  name: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  caption: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  total: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    letterSpacing: -0.2,
    color: colors.text,
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    paddingRight: 2,
  },
  clearButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
});

export default styles;
