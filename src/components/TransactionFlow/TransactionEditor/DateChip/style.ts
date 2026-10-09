import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  section: {
    rowGap: theme.spacing.md - 2,
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  chip: {
    alignSelf: 'flex-start',
    height: 44,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md + 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipError: {
    borderColor: colors.danger,
  },
  // SemiBold under-measures its width in a content-sized chip (see cde3346).
  chipText: {
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
  error: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.danger,
  },
});

export default styles;
