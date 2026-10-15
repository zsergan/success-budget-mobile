import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  fields: {
    rowGap: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    columnGap: theme.spacing.md,
  },
  name: {
    flex: 2,
  },
  currency: {
    flex: 1,
  },
});

export default styles;
