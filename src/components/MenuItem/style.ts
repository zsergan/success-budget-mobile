import { StyleSheet } from 'react-native';

import theme, { colors, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: colors.surface,
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
    color: colors.text,
  },
});

export default styles;
