import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    section: {
      rowGap: theme.spacing.sm,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    inviteRow: {
      height: 54,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm + 2,
      paddingLeft: theme.spacing.md + 2,
      paddingRight: theme.spacing.xs,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    inviteInput: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.text,
      padding: 0,
    },
    inviteButton: {
      height: 40,
      paddingHorizontal: theme.spacing.md + 3,
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
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
  });

export default createStyles;
