import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'space-between',
    },
    sectionsContainer: {
      rowGap: scaleSpace(theme.spacing.xl, layout),
    },
    section: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    typeSwitch: {
      minHeight: 46,
      borderRadius: 15,
      padding: scaleSpace(4, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(4, layout),
      backgroundColor: colors.track,
    },
    typeTab: {
      flex: 1,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(theme.spacing.xs, layout) + 3,
    },
    typeTabActive: {
      backgroundColor: colors.elevated,
      ...elevation.segment,
    },
    typeTabText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
    typeTabTextActive: {
      color: colors.text,
    },
    retryCurrencies: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    hint: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    inviteInputRowError: {
      borderColor: colors.danger,
    },
    inviteError: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
    invitesContainer: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    inviteRow: {
      minHeight: 48,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 2,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.hairline,
    },
    inviteEmail: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
    inviteRemove: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    inviteInputRow: {
      minHeight: 52,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 2,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) + 2,
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
    inviteAdd: {
      width: 28,
      height: 28,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
  });

export default createStyles;
