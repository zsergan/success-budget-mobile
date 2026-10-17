import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme) =>
  StyleSheet.create({
    root: {
      width: '100%',
    },
    topBlock: {
      paddingTop: theme.spacing.sm,
      rowGap: theme.spacing.md + 2,
    },
    header: {
      paddingHorizontal: theme.spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      flex: 1,
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
    preview: {
      marginHorizontal: theme.spacing.xl,
      borderRadius: theme.radius.lg - 2,
      padding: theme.spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.md + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    previewText: {
      flex: 1,
      minWidth: 0,
      rowGap: 4,
    },
    previewName: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg + 2,
      letterSpacing: -0.2,
      color: colors.text,
    },
    previewSub: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      color: colors.muted,
    },
    body: {
      flex: 1,
      marginTop: theme.spacing.lg,
    },
    container: {
      marginHorizontal: theme.spacing.xl,
      rowGap: theme.spacing.xl,
      paddingBottom: theme.spacing.xl,
    },
    section: {
      rowGap: theme.spacing.sm - 1,
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    nameField: {
      height: 52,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    nameFieldFocused: {
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    nameInput: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.text,
      padding: 0,
    },
    nameCount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      color: colors.muted,
    },
    typeSwitch: {
      height: 46,
      borderRadius: theme.radius.md,
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
      ...elevation.segment,
    },
    typeTabText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.label,
      lineHeight: theme.lineHeights.label,
    },
    typeHint: {
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 8,
    },
    typeHintText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.muted,
    },
    lockedLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 7,
    },
    lockedBadge: {
      height: 17,
      paddingHorizontal: 6,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    lockedBadgeText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 9,
      letterSpacing: 0.6,
      color: colors.muted,
    },
    lockedBox: {
      height: 52,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 11,
      paddingHorizontal: theme.spacing.lg,
      backgroundColor: colors.track,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    lockedBoxText: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.muted,
    },
    iconNote: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.micro,
      color: colors.muted,
    },
    deleteButton: {
      height: 50,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 8,
      backgroundColor: colors.dangerTint,
    },
    deleteButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg - 1,
      color: colors.danger,
    },
    footer: {
      marginTop: theme.spacing.md,
      marginHorizontal: theme.spacing.xl,
      marginBottom: theme.spacing.xl,
    },
    saveButton: {
      height: 52,
      borderRadius: theme.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
    },
    saveButtonDisabled: {
      backgroundColor: colors.track,
    },
    saveButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodyLg,
      color: colors.onAccent,
    },
    saveButtonTextDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
