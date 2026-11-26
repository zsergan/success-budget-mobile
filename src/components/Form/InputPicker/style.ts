import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { FITTED_SHEET_HANDLE_HEIGHT } from '@components/Modals/BottomSheetModal/BottomSheetModal';
import { fitHeight, textRole } from '@shared/layout';
import theme, { horizontalScreenPadding } from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: theme.spacing.xs,
    },
    inputContainer: {
      ...fitHeight(52, theme.lineHeights.bodyLg),
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radius.md,
      backgroundColor: colors.surface,
    },
    input: {
      textAlign: 'center',
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodyLg,
      lineHeight: theme.lineHeights.bodyLg,
      color: colors.text,
    },
    placeholder: {
      color: colors.muted,
    },
    inputWithShadow: { ...elevation.card },
    outlinedValue: {
      lineHeight: 20,
    },
    label: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    // The same rhythm as a confirmation sheet: 20 under the grabber, 16 between slots.
    sheet: {
      rowGap: theme.spacing.lg,
      paddingTop: 8 + 5 + 20 - FITTED_SHEET_HANDLE_HEIGHT,
      paddingHorizontal: horizontalScreenPadding,
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
