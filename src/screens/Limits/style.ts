import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    lineHeight: theme.lineHeights.titleLg,
    letterSpacing: theme.letterSpacing.titleLg,
    color: colors.text,
  },
  periodPill: {
    height: 32,
    paddingHorizontal: theme.spacing.md - 1,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm - 1,
    backgroundColor: colors.track,
  },
  periodMonth: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.text,
  },
  periodDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.hairline,
  },
  periodDays: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  body: {
    flex: 1,
  },
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl + 70,
    rowGap: theme.spacing.lg,
  },
  emptyBlock: {
    marginTop: theme.spacing.lg,
    rowGap: theme.spacing.lg,
  },
  rules: {
    rowGap: theme.spacing.sm + 1,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: theme.spacing.sm,
  },
  ruleText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  section: {
    rowGap: theme.spacing.md - 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  addButton: {
    height: 30,
    paddingHorizontal: theme.spacing.md - 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: colors.track,
  },
  addButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.text,
  },
  list: {
    rowGap: theme.spacing.sm + 2,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.xl,
    bottom: theme.spacing.xxl,
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
