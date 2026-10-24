import { StyleSheet } from 'react-native';

import { FITTED_SHEET_HANDLE_HEIGHT } from '@components/Modals/BottomSheetModal/BottomSheetModal';
import type { ColorTheme } from '@shared/theme';
import theme, { horizontalScreenPadding } from '@shared/theme';

// The title sits 20 below the 5 pt grabber, which the design draws 8 from the top of the sheet.
const TITLE_TOP = 8 + 5 + 20;
const SLOT_GAP = theme.spacing.lg;
const BULLET_SIZE = 5;

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    sheet: {
      flexShrink: 1,
    },
    body: {
      flexGrow: 0,
      flexShrink: 1,
    },
    bodyContent: {
      rowGap: SLOT_GAP,
      paddingTop: TITLE_TOP - FITTED_SHEET_HANDLE_HEIGHT,
      paddingHorizontal: horizontalScreenPadding,
    },
    step: {
      fontFamily: theme.fonts.bold,
      fontSize: 11.5,
      lineHeight: theme.lineHeights.micro,
      letterSpacing: theme.letterSpacing.micro,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    heading: {
      rowGap: theme.spacing.sm,
    },
    title: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.titleMd,
      lineHeight: theme.lineHeights.titleMd,
      letterSpacing: -0.5,
      color: colors.text,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: 15,
      lineHeight: theme.lineHeights.bodyLg,
      color: colors.muted,
    },
    consequences: {
      rowGap: 7,
      padding: 14,
      borderRadius: 16,
    },
    consequencesTitle: {
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
    },
    consequence: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 9,
    },
    bullet: {
      width: BULLET_SIZE,
      height: BULLET_SIZE,
      marginTop: (theme.lineHeights.bodySm - BULLET_SIZE) / 2,
      borderRadius: BULLET_SIZE / 2,
    },
    consequenceText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.text,
    },
    footer: {
      rowGap: 10,
      paddingTop: SLOT_GAP,
      paddingHorizontal: horizontalScreenPadding,
    },
    // Only once the body scrolls, so the pinned actions stay apart from the content passing under them.
    footerDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.line,
    },
    message: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 10,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: 14,
      borderRadius: 16,
    },
    messageIcon: {
      marginTop: (theme.lineHeights.bodySm - 16) / 2,
    },
    messageText: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.text,
    },
    note: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.muted,
    },
  });

export default createStyles;
