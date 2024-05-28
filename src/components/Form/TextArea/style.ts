import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.primary,
    backgroundColor: palette.grey,
    borderRadius: theme.radius.sm,
  },
});

export default styles;
