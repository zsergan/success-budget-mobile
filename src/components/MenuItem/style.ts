import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background.overlay,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  label: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
});

export default styles;
