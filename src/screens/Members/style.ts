import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    rowGap: theme.spacing.sm,
  },
  spaceLine: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
  },
  scrollContent: {
    rowGap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    rowGap: theme.spacing.sm,
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  countLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  hint: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  inviteRow: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm + 2,
    paddingLeft: theme.spacing.md + 2,
    paddingRight: theme.spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  inviteInput: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
    padding: 0,
  },
  inviteButton: {
    height: 40,
    paddingHorizontal: theme.spacing.md + 3,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  inviteButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
  rows: {
    rowGap: theme.spacing.sm - 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.md,
    padding: theme.spacing.sm + 2,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  rowAvatarSelf: {
    backgroundColor: `${colors.accent}26`,
  },
  rowInitials: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.3,
    color: colors.text,
  },
  rowInitialsSelf: {
    color: colors.accent,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    rowGap: 3,
  },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.xs + 3,
  },
  rowName: {
    flexShrink: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
  rowTag: {
    height: 19,
    paddingHorizontal: theme.spacing.xs + 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  rowTagInvite: {
    backgroundColor: `${colors.warn}33`,
  },
  rowTagText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.text,
  },
  rowTagTextInvite: {
    color: colors.warn,
  },
  rowMeta: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  rowRemove: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger}1A`,
  },
  leaveButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.spacing.sm + 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: `${colors.danger}66`,
  },
  leaveButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.danger,
  },
  confirmText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    textAlign: 'center',
    color: colors.text,
  },
  codeContainer: {
    alignItems: 'center',
    rowGap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  codeTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
    textAlign: 'center',
  },
  code: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    letterSpacing: 4,
    color: colors.accent,
  },
});

export default styles;
