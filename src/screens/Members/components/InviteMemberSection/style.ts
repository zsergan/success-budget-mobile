import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    section: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    error: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
    inviteRowError: {
      borderColor: colors.danger,
    },
    inviteRow: {
      minHeight: 54,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 2,
      paddingLeft: scaleSpace(theme.spacing.md, layout) + 2,
      paddingRight: scaleSpace(theme.spacing.xs, layout),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    inviteInput: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
      padding: 0,
    },
    inviteButton: {
      minHeight: 40,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 3,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    inviteButtonDisabled: {
      opacity: 0.5,
    },
    inviteButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
    },
  });

export default createStyles;
