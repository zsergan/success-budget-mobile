import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  chip: {
    padding: theme.spacing.sm,
    backgroundColor: palette.grey,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    columnGap: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
  },
});

export default styles;
