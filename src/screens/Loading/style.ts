import { StyleSheet } from 'react-native';
import theme from '@shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: theme.fonts.bold,
    fontSize: 36,
    color: theme.colors.text.secondary,
  },
});

export default styles;
