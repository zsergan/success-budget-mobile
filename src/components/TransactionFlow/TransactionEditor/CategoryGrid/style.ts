import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  section: {
    rowGap: theme.spacing.md - 2,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  sectionHint: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  categoryGrid: {
    marginHorizontal: -5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryCell: {
    width: '25%',
    paddingHorizontal: 5,
    marginBottom: 14,
    alignItems: 'center',
    rowGap: 6,
  },
  categoryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  categoryName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    color: colors.muted,
  },
  archivedBadge: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  empty: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    rowGap: theme.spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
  },
  emptyText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.muted,
  },
  createButton: {
    height: 36,
    borderRadius: 11,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: colors.track,
  },
  // SemiBold under-measures its width in a content-sized chip (see cde3346).
  createButtonText: {
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
});

export default styles;
