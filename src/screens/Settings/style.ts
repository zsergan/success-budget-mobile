import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    rowGap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    rowGap: theme.spacing.sm - 2,
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    paddingLeft: theme.spacing.xs,
    color: colors.muted,
  },
  card: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.md,
    padding: theme.spacing.md + 2,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    rowGap: 3,
  },
  rowLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  rowLabelDanger: {
    color: colors.danger,
  },
  rowSub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  rowValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.muted,
  },
  toggleTrack: {
    width: 48,
    height: 29,
    borderRadius: 15,
    padding: 3,
    backgroundColor: colors.track,
  },
  toggleKnob: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: colors.elevated,
  },
  themeRow: {
    rowGap: theme.spacing.md - 1,
    padding: theme.spacing.md + 2,
  },
  themeSwitch: {
    height: 44,
    borderRadius: 15,
    padding: 4,
    flexDirection: 'row',
    columnGap: 4,
    backgroundColor: colors.track,
  },
  themeTab: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTabActive: {
    backgroundColor: colors.elevated,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  themeTabText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
  },
  themeTabTextActive: {
    color: colors.text,
  },
  confirmText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    textAlign: 'center',
    color: colors.text,
  },
  confirmSubtext: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    textAlign: 'center',
    color: colors.muted,
  },
});

export default styles;
