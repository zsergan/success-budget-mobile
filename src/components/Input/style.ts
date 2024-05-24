import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  input: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    borderRadius: 16,
    backgroundColor: theme.colors.background.primary,
  },
  label: {
    paddingLeft: 12,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
});

export default styles;
