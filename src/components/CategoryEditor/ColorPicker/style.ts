import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  colorRow: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  colorSwatch: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderWidth: 2,
    borderColor: colors.text,
  },
});

export default styles;
