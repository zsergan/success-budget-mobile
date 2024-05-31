import { StyleSheet } from 'react-native';

import theme, { horizontalScreenPadding } from '@shared/theme';

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
  alert: {
    position: 'absolute',
    top: '15%',
    left: theme.spacing.xl,
    right: theme.spacing.xl,
  },
});

export default styles;
