import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sectionsContainer: {
    rowGap: theme.spacing.xl,
  },
  section: {
    rowGap: theme.spacing.sm,
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  typeSwitch: {
    height: 46,
    borderRadius: 15,
    padding: 4,
    flexDirection: 'row',
    columnGap: 4,
    backgroundColor: colors.track,
  },
  typeTab: {
    flex: 1,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.spacing.xs + 3,
  },
  typeTabActive: {
    backgroundColor: colors.elevated,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  typeTabText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
  },
  typeTabTextActive: {
    color: colors.text,
  },
  hint: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  invitesContainer: {
    rowGap: theme.spacing.sm,
  },
  inviteRow: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md + 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  inviteEmail: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
  inviteRemove: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  inviteInputRow: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md + 2,
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
  inviteAdd: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
});

export default styles;
