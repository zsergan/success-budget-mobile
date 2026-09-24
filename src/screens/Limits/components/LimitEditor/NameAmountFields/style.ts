import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  nameSection: {
    rowGap: theme.spacing.sm - 2,
  },
  nameBox: {
    height: 50,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  nameBoxWithError: {
    borderWidth: 1.5,
    borderColor: colors.danger,
  },
  nameInput: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
    padding: 0,
  },
  nameHint: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.micro,
    color: colors.muted,
  },
  nameError: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.danger,
  },
  sectionLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  hero: {
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    rowGap: theme.spacing.xs,
    backgroundColor: colors.surface,
  },
  heroLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    columnGap: 6,
  },
  heroAmount: {
    minWidth: 24,
    fontFamily: theme.fonts.semiBold,
    fontSize: 46,
    letterSpacing: -2,
    color: colors.text,
    padding: 0,
  },
  heroCurrency: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleMd,
    color: colors.muted,
  },
  heroSub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  heroSubError: {
    color: colors.danger,
  },
  spentContext: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
    backgroundColor: colors.track,
  },
  spentContextText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.text,
  },
});

export default styles;
