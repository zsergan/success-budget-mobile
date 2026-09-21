import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  title: {
    marginTop: 26,
  },
  section: {
    marginTop: 14,
  },
  confirmContainer: {
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  confirmText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  longPressedItem: {
    width: '100%',
  },
});

export default styles;
