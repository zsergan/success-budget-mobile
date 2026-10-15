import { StyleSheet } from 'react-native';

import { horizontalScreenPadding } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScreenPadding,
  },
});

export default styles;
