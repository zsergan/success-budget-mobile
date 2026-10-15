import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingBottom: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.accent,
  },
  title: {
    // Plus Jakarta Sans under-measures; see cde3346.
    paddingRight: 2,
    fontFamily: theme.fonts.bold,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.text,
  },
});

export default styles;
