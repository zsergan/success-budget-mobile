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
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    lineHeight: theme.lineHeights.titleLg,
    letterSpacing: theme.letterSpacing.titleLg,
    color: colors.text,
  },
});

export default styles;
