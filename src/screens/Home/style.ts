import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    marginVertical: 8,
    marginHorizontal: 8,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: theme.spacing.xxl,
    left: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    columnGap: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});

export default styles;
