import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  // Shrinks under the sheet's maximum height; only the body scrolls, the header and actions stay.
  root: {
    flexShrink: 1,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    rowGap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  body: {
    rowGap: theme.spacing.lg,
  },
  hero: {
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    textAlign: 'center',
    color: colors.text,
  },
  amount: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    lineHeight: theme.lineHeights.titleLg,
    letterSpacing: theme.letterSpacing.titleLg,
  },
  typeChip: {
    height: 26,
    borderRadius: 9,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  // SemiBold under-measures its width in a content-sized chip (see cde3346).
  typeChipText: {
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
  },
  card: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md + 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  description: {
    fontFamily: theme.fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  property: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: theme.spacing.md,
  },
  propertyLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
  },
  propertyValue: {
    flexShrink: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    textAlign: 'right',
    color: colors.text,
  },
  propertyValueMuted: {
    color: colors.muted,
  },
  divider: {
    height: 1,
    marginVertical: theme.spacing.md,
    backgroundColor: colors.hairline,
  },
  editButton: {
    height: 52,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.spacing.sm,
    backgroundColor: colors.track,
  },
  buttonLocked: {
    opacity: 0.5,
  },
  editButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
  systemNote: {
    paddingVertical: theme.spacing.md,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    textAlign: 'center',
    color: colors.muted,
  },
});

export default styles;
