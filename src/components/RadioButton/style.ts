import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: theme.border.color,
    borderRadius: theme.border.radius,
    backgroundColor: theme.colors.background.primary,
  },
  button: {
    marginHorizontal: 24,
    marginVertical: 8,
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  selected: {
    backgroundColor: theme.colors.background.highlight,
  },
});

export default styles;
