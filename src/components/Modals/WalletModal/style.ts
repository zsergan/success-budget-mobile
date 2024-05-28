import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  content: {
    width: '100%',
    paddingHorizontal: theme.spacing.xl,
    ...shadow,
  },
});

export default styles;
