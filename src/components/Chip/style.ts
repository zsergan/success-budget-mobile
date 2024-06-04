import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  chip: {
    padding: theme.spacing.sm,
    backgroundColor: palette.grey,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    columnGap: theme.spacing.xs,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: palette.green,
  },
  title: {
    fontFamily: theme.fonts.medium,
  },
  smTitle: {
    fontSize: theme.fontSizes.xs,
  },
  mdTitle: {
    fontSize: theme.fontSizes.md,
  },
});

export default styles;
