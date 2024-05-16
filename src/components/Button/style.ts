import { StyleSheet } from 'react-native';

import theme, { shadow } from '@shared/theme';

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.border.radius,
    alignItems: 'center',
    paddingVertical: 11,
    backgroundColor: theme.colors.background.primary,
    ...shadow,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    lineHeight: 28,
    color: theme.colors.text.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default styles;
