import { StyleSheet } from 'react-native';

import { FITTED_SHEET_HANDLE_HEIGHT } from '@components/Modals/BottomSheetModal/BottomSheetModal';
import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

// The title sits 20 below the 5 pt grabber, which the design draws 8 from the top of the sheet.
const TITLE_TOP = 8 + 5 + 20;
const SLOT_GAP = theme.spacing.lg;
const BULLET_SIZE = 5;

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
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
      paddingHorizontal: screenPadding(layout),
    },
    step: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(11.5, layout),
      lineHeight: scaleFont(theme.lineHeights.micro, layout),
      letterSpacing: theme.letterSpacing.micro,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    heading: {
      rowGap: scaleSpace(theme.spacing.sm, layout),
    },
    title: {
      fontFamily: theme.fonts.bold,
      ...textRole('titleMd', layout),
      letterSpacing: -0.5,
      color: colors.text,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(15, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.muted,
    },
    consequences: {
      rowGap: scaleSpace(7, layout),
      padding: scaleSpace(14, layout),
      borderRadius: 16,
    },
    consequencesTitle: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
    },
    consequence: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(9, layout),
    },
    bullet: {
      width: BULLET_SIZE,
      height: BULLET_SIZE,
      marginTop: (scaleFont(theme.lineHeights.bodySm, layout) - BULLET_SIZE) / 2,
      borderRadius: BULLET_SIZE / 2,
    },
    consequenceText: {
      flex: 1,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.text,
    },
    footer: {
      rowGap: scaleSpace(10, layout),
      paddingTop: SLOT_GAP,
      paddingHorizontal: screenPadding(layout),
    },
    // Only once the body scrolls, so the pinned actions stay apart from the content passing under them.
    footerDivided: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.line,
    },
    message: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(10, layout),
      paddingVertical: scaleSpace(theme.spacing.md, layout),
      paddingHorizontal: scaleSpace(14, layout),
      borderRadius: 16,
    },
    messageIcon: {
      marginTop: (scaleFont(theme.lineHeights.bodySm, layout) - 16) / 2,
    },
    messageText: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.text,
    },
    note: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(12.5, layout),
      lineHeight: scaleFont(18, layout),
      color: colors.muted,
    },
  });

export default createStyles;
