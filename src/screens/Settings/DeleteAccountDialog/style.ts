import { StyleSheet } from 'react-native';

import theme, { colors, shadowModal } from '@shared/theme';

const styles = StyleSheet.create({
  card: {
    width: '86%',
    maxWidth: 380,
    borderRadius: theme.radius.lg + 6,
    padding: theme.spacing.xl + 2,
    rowGap: theme.spacing.lg,
    backgroundColor: colors.elevated,
    ...shadowModal,
  },
  step: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.md + 1,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.danger}1F`,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    rowGap: 3,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm - 1,
    letterSpacing: -0.3,
    color: colors.text,
  },
  body: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
  },
  listBox: {
    borderRadius: theme.radius.md + 2,
    padding: theme.spacing.md + 1,
    rowGap: theme.spacing.sm,
    backgroundColor: `${colors.danger}14`,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
  },
  listHead: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.danger,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  listDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.danger,
  },
  listLabel: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: colors.text,
  },
  fieldLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  fieldHint: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  strip: {
    borderRadius: theme.radius.md + 2,
    padding: theme.spacing.md + 1,
    backgroundColor: `${colors.danger}14`,
    borderWidth: 1,
    borderColor: `${colors.danger}33`,
  },
  stripText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.danger,
  },
  note: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    textAlign: 'center',
    color: colors.muted,
  },
  actions: {
    rowGap: theme.spacing.sm + 1,
  },
  primaryButton: {
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.track,
  },
  primaryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: '#FFFDFA',
  },
  primaryButtonTextDisabled: {
    color: colors.muted,
  },
  secondaryButton: {
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  secondaryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
});

export default styles;
