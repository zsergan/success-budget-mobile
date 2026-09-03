import { StyleSheet } from 'react-native';
import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  text: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.lg,
    color: colors.text,
  },
});

export default styles;
