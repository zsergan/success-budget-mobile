import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: colors.track,
  },
  header: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  body: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  description: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.label,
    lineHeight: 20,
    color: colors.muted,
  },
  createButton: {
    marginTop: 26,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.spacing.sm,
    backgroundColor: colors.accent,
  },
  createButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.onAccent,
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    paddingRight: 2,
  },
});

export default styles;
