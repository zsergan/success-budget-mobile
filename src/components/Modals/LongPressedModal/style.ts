import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.xl,
    alignSelf: 'flex-end',
    ...shadow,
  },
  options: {
    alignSelf: 'flex-end',
  },
});

export default styles;
