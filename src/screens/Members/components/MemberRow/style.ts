import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout),
      padding: scaleSpace(theme.spacing.sm, layout) + 2,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    rowAvatar: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    rowAvatarSelf: {
      backgroundColor: `${colors.accent}26`,
    },
    rowInitials: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      letterSpacing: 0.3,
      color: colors.text,
    },
    rowInitialsSelf: {
      color: colors.accent,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(3, layout),
    },
    // With large text the badge drops under the name instead of cutting it short.
    rowNameLine: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.xs, layout) + 3,
      rowGap: 2,
    },
    rowName: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
    rowTag: {
      minHeight: 19,
      paddingHorizontal: scaleSpace(theme.spacing.xs, layout) + 3,
      paddingVertical: 1,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    rowTagInvite: {
      backgroundColor: `${colors.warn}33`,
    },
    rowTagText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(10, layout),
      letterSpacing: 0.3,
      color: colors.text,
    },
    rowTagTextInvite: {
      color: colors.warn,
    },
    rowResend: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    rowResendQuiet: {
      backgroundColor: 'transparent',
    },
    rowResendDisabled: {
      opacity: 0.45,
    },
    rowMetaFailed: {
      fontFamily: theme.fonts.semiBold,
      color: colors.danger,
    },
    rowMeta: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    rowRemove: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${colors.danger}1A`,
    },
  });

export default createStyles;
