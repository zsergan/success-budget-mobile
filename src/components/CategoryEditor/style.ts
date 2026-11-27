import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      width: '100%',
    },
    topBlock: {
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      rowGap: scaleSpace(theme.spacing.md, layout) + 2,
    },
    header: {
      paddingHorizontal: screenPadding(layout),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleSm', layout),
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
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      borderRadius: theme.radius.lg - 2,
      padding: scaleSpace(theme.spacing.md, layout) + 2,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.md, layout) + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    previewText: {
      flex: 1,
      minWidth: 0,
      rowGap: scaleSpace(4, layout),
    },
    previewName: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout) + 2,
      letterSpacing: -0.2,
      color: colors.text,
    },
    previewSub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
    body: {
      flex: 1,
      marginTop: scaleSpace(theme.spacing.lg, layout),
    },
    container: {
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      rowGap: scaleSpace(theme.spacing.xl, layout),
      paddingBottom: scaleSpace(theme.spacing.xl, layout),
    },
    section: {
      rowGap: scaleSpace(theme.spacing.sm, layout) - 1,
    },
    sectionLabel: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    sectionLabelRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    colorName: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    nameField: {
      minHeight: 52,
      borderRadius: theme.radius.md,
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
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
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
      padding: 0,
    },
    nameFieldError: {
      borderColor: colors.danger,
    },
    nameError: {
      marginTop: scaleSpace(theme.spacing.xs, layout) + 2,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.danger,
    },
    nameCount: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    typeSwitch: {
      minHeight: 46,
      borderRadius: theme.radius.md,
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
      columnGap: scaleSpace(7, layout),
    },
    typeTabActive: {
      backgroundColor: colors.elevated,
      ...elevation.segment,
    },
    typeTabText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
    },
    typeHint: {
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(8, layout),
    },
    typeHintText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.muted,
    },
    lockedLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(7, layout),
    },
    lockedBadge: {
      minHeight: 17,
      paddingHorizontal: scaleSpace(6, layout),
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    lockedBadgeText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(9, layout),
      letterSpacing: 0.6,
      color: colors.muted,
    },
    lockedBox: {
      minHeight: 52,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(11, layout),
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      backgroundColor: colors.track,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    lockedBoxText: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.muted,
    },
    iconNote: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.micro, layout),
      color: colors.muted,
    },
    deleteButton: {
      minHeight: 50,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(8, layout),
      backgroundColor: colors.dangerTint,
    },
    deleteButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout) - 1,
      color: colors.danger,
    },
    footer: {
      marginTop: scaleSpace(theme.spacing.md, layout),
      marginHorizontal: scaleSpace(theme.spacing.xl, layout),
      marginBottom: scaleSpace(theme.spacing.xl, layout),
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    saveButton: {
      minHeight: 52,
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
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.onAccent,
    },
    saveButtonTextDisabled: {
      color: colors.muted,
    },
  });

export default createStyles;
