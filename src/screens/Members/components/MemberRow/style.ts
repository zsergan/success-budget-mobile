import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
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
});

export default styles;
