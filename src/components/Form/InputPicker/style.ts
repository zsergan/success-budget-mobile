import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { FITTED_SHEET_HANDLE_HEIGHT } from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { fitHeight, scaleFont, scaleSpace, screenPadding, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    inputContainer: {
      ...fitHeight(52, scaleFont(theme.lineHeights.bodyLg, layout)),
      justifyContent: 'center',
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      borderRadius: theme.radius.md,
      backgroundColor: colors.surface,
    },
    input: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodyLg, layout),
      lineHeight: scaleFont(theme.lineHeights.bodyLg, layout),
      color: colors.text,
    },
    placeholder: {
      color: colors.muted,
    },
    inputWithShadow: { ...elevation.card },
    outlinedValue: {
      lineHeight: scaleFont(20, layout),
    },
    label: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      color: colors.text,
    },
    // The same rhythm as a confirmation sheet: 20 under the grabber, 16 between slots.
    sheet: {
      rowGap: scaleSpace(theme.spacing.lg, layout),
      paddingTop: 8 + 5 + 20 - FITTED_SHEET_HANDLE_HEIGHT,
      paddingHorizontal: screenPadding(layout),
    },
    sheetTitle: {
      fontFamily: theme.fonts.bold,
      ...textRole('titleMd', layout),
      letterSpacing: -0.5,
      color: colors.text,
    },
    // iOS draws the wheel's rows in black unless told otherwise.
    pickerItem: {
      color: colors.text,
    },
  });

export default createStyles;
