import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
  },
  // Groups the drag handle, title row, type switch and amount hero under one
  // shared top inset + gap, matching the design's column layout instead of
  // each piece carrying its own (previously inconsistent) margin.
  topBlock: {
    paddingTop: theme.spacing.lg,
    rowGap: theme.spacing.md + 2,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: colors.track,
  },
  emptyText: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.xl,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
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
  typeSwitch: {
    marginHorizontal: theme.spacing.xl,
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
    columnGap: 7,
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
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
  },
  hero: {
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  heroLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
    letterSpacing: theme.letterSpacing.micro,
    textTransform: 'uppercase',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: 4,
  },
  heroAmount: {
    minWidth: 24,
    fontFamily: theme.fonts.semiBold,
    fontSize: 52,
    letterSpacing: -2,
    padding: 0,
  },
  heroCurrency: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    opacity: 0.65,
  },
  heroSub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  // Without an explicit flex the ScrollView sized itself to its content
  // instead of the sheet's remaining height — the keyboard's automatic
  // inset then had no real frame to measure against, so the body opened
  // pre-scrolled and could be dragged past its own content.
  body: {
    flex: 1,
    marginTop: theme.spacing.lg,
  },
  container: {
    marginHorizontal: theme.spacing.xl,
    rowGap: theme.spacing.xl,
  },
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
  walletsRow: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  walletChip: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  walletDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  walletChipText: {
    flexShrink: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
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
    width: '100%',
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
  dateTimeRow: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  dateBox: {
    flex: 1,
  },
  timeBox: {
    width: 118,
  },
  pickerBox: {
    height: 50,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md + 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pickerText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
  note: {
    minHeight: 64,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md + 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    rowGap: theme.spacing.sm,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
  },
  helperText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  saveButton: {
    height: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 9,
    backgroundColor: colors.track,
  },
  saveButtonReady: {
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
  },
  saveButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    letterSpacing: -0.1,
    color: colors.muted,
  },
});

export default styles;
