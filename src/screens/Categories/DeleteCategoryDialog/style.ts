import { StyleSheet } from 'react-native';

import theme, { colors, colorScheme, shadowModal } from '@shared/theme';

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
  },
  iconBoxDelete: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(242,105,90,.14)' : 'rgba(224,79,61,.09)',
  },
  iconBoxArchive: {
    backgroundColor: colorScheme === 'dark' ? 'rgba(247,189,77,.12)' : '#fff6e4',
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
  subtitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  body: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
  },
  noticeBox: {
    borderRadius: theme.radius.md + 2,
    padding: theme.spacing.md + 1,
    flexDirection: 'row',
    columnGap: theme.spacing.md - 1,
    backgroundColor: colorScheme === 'dark' ? 'rgba(247,189,77,.12)' : '#fff6e4',
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? 'rgba(247,189,77,.28)' : '#f6e3bd',
  },
  noticeText: {
    flex: 1,
    rowGap: 5,
  },
  noticeTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
  noticeBody: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: theme.spacing.sm + 1,
  },
  footnoteText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  actions: {
    rowGap: theme.spacing.sm + 1,
  },
  confirmButton: {
    height: 50,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  confirmButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
  },
  cancelButton: {
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cancelButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
});

export default styles;
