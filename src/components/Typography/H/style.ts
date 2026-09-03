import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  h: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.xl,
    color: colors.text,
  },
});

export default styles;
