import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm + 2,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleMd,
    lineHeight: theme.lineHeights.titleMd,
    letterSpacing: theme.letterSpacing.titleMd,
    color: colors.text,
  },
  sortChip: {
    height: 32,
    paddingHorizontal: theme.spacing.sm + 2,
    borderRadius: theme.radius.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
    backgroundColor: colors.track,
  },
  sortChipActive: {
    backgroundColor: colors.accent,
  },
  sortChipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.text,
  },
  sortChipTextActive: {
    color: colors.onAccent,
  },
  searchRow: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    height: 44,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  searchRowActive: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
    padding: 0,
  },
  resultNote: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  segmentedWrap: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  body: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 120,
    rowGap: theme.spacing.sm + 2,
  },
  archiveFootnoteRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: theme.spacing.sm,
  },
  archiveFootnoteText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  loadingContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabRoot: {
    position: 'absolute',
    right: theme.spacing.xl,
    bottom: theme.spacing.xxl,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
});

export default styles;
