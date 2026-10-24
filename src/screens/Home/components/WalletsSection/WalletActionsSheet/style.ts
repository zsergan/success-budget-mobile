import { StyleSheet } from 'react-native';

import { FITTED_SHEET_HANDLE_HEIGHT } from '@components/Modals/BottomSheetModal/BottomSheetModal';
import theme, { horizontalScreenPadding } from '@shared/theme';

// The same rhythm as a confirmation sheet: 20 under the grabber, 16 between slots.
const CONTENT_TOP = 8 + 5 + 20;

const createStyles = () =>
  StyleSheet.create({
    sheet: {
      rowGap: theme.spacing.lg,
      paddingTop: CONTENT_TOP - FITTED_SHEET_HANDLE_HEIGHT,
      paddingHorizontal: horizontalScreenPadding,
    },
    actions: {
      rowGap: 10,
    },
  });

export default createStyles;
