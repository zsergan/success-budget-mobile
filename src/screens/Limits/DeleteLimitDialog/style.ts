import { StyleSheet } from 'react-native';

import theme, { colors, shadowModal } from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const styles = StyleSheet.create({
  card: {
    width: 320,
    borderRadius: theme.radius.lg + 6,
    padding: theme.spacing.xl + 2,
    alignItems: 'center',
    backgroundColor: colors.elevated,
    ...shadowModal,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: hexToRgba(colors.danger, 0.1),
  },
  title: {
    marginTop: theme.spacing.md + 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    textAlign: 'center',
    color: colors.text,
  },
  description: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    textAlign: 'center',
    color: colors.muted,
  },
  preview: {
    marginTop: theme.spacing.md + 2,
    width: '100%',
    borderRadius: theme.radius.md,
    padding: theme.spacing.md - 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.md - 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  previewIconBox: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 1,
    rowGap: 1,
    padding: 5,
    backgroundColor: colors.track,
  },
  previewText: {
    flex: 1,
    rowGap: 2,
  },
  previewName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
  },
  previewAmount: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  actions: {
    marginTop: theme.spacing.lg,
    width: '100%',
    rowGap: theme.spacing.sm - 1,
  },
  deleteButton: {
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  deleteButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: '#FFFDFA',
  },
  keepButton: {
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  keepButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
});

export default styles;
