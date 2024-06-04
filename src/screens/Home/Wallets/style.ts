import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  confirmContainer: {
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  confirmText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.xs,
    color: palette.black,
  },
  longPressedItem: {
    width: '100%',
  },
});

export default styles;
