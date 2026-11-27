import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    // Shrinks under the sheet's maximum height; only the body scrolls, the header and actions stay.
    root: {
      flexShrink: 1,
      paddingTop: scaleSpace(theme.spacing.sm, layout),
      paddingHorizontal: screenPadding(layout),
      rowGap: scaleSpace(theme.spacing.md, layout),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    body: {
      rowGap: scaleSpace(theme.spacing.lg, layout),
    },
    hero: {
      alignItems: 'center',
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    heroIcon: {
      width: 60,
      height: 60,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    category: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      textAlign: 'center',
      color: colors.text,
    },
    amount: {
      fontFamily: theme.fonts.semiBold,
      ...textRole('titleLg', layout),
      letterSpacing: theme.letterSpacing.titleLg,
    },
    typeChip: {
      minHeight: 26,
      borderRadius: 9,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      justifyContent: 'center',
    },
    // SemiBold under-measures its width in a content-sized chip (see cde3346).
    typeChipText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
    },
    card: {
      borderRadius: theme.radius.md,
      padding: scaleSpace(theme.spacing.md, layout) + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(15, layout),
      lineHeight: scaleFont(22, layout),
      color: colors.text,
    },
    property: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      columnGap: scaleSpace(theme.spacing.md, layout),
    },
    propertyLabel: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.muted,
    },
    propertyValue: {
      flexShrink: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      textAlign: 'right',
      color: colors.text,
    },
    propertyValueMuted: {
      color: colors.muted,
    },
    personValue: {
      flexShrink: 1,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    personTexts: {
      flexShrink: 1,
      alignItems: 'flex-end',
    },
    propertySub: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      textAlign: 'right',
      color: colors.muted,
    },
    importNote: {
      borderRadius: theme.radius.md,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout),
      paddingVertical: scaleSpace(10, layout),
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.track,
    },
    importNoteText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.muted,
    },
    divider: {
      height: 1,
      marginVertical: scaleSpace(theme.spacing.md, layout),
      backgroundColor: colors.hairline,
    },
    editButton: {
      minHeight: 52,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
      backgroundColor: colors.track,
    },
    buttonLocked: {
      opacity: 0.5,
    },
    editButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      color: colors.text,
    },
    systemNote: {
      paddingVertical: scaleSpace(theme.spacing.md, layout),
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      textAlign: 'center',
      color: colors.muted,
    },
  });

export default createStyles;
