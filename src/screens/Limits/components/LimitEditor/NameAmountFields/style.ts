import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    nameSection: {
      rowGap: scaleSpace(theme.spacing.sm, layout) - 2,
    },
    nameBox: {
      minHeight: 50,
      borderRadius: theme.radius.md,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
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
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
      padding: 0,
    },
    nameHint: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    nameError: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      letterSpacing: 0.3,
      color: colors.muted,
    },
    hero: {
      borderRadius: theme.radius.lg,
      paddingVertical: scaleSpace(theme.spacing.lg, layout),
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.xs, layout),
      backgroundColor: colors.surface,
    },
    heroLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      columnGap: scaleSpace(6, layout),
    },
    heroAmount: {
      minWidth: 24,
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('display', scaleFont(46, layout), layout),
      letterSpacing: -2,
      color: colors.text,
      padding: 0,
    },
    heroCurrency: {
      fontFamily: theme.fonts.semiBold,
      fontSize: capRole('titleMd', scaleFont(theme.fontSizes.titleMd, layout), layout),
      color: colors.muted,
    },
    heroSub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
      textAlign: 'center',
    },
    heroSubError: {
      color: colors.danger,
    },
    spentContext: {
      borderRadius: theme.radius.md,
      padding: scaleSpace(theme.spacing.md, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.track,
    },
    spentContextText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.text,
    },
  });

export default createStyles;
