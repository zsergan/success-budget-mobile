import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    marginTop: 22,
    marginBottom: 10,
    rowGap: 10,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    letterSpacing: -0.2,
    color: colors.text,
  },
  modes: {
    flexDirection: 'row',
    columnGap: 7,
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  chipTextActive: {
    color: colors.onSecondary,
  },
});

export default styles;
