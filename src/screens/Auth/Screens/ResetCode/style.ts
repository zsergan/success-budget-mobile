import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  failure: {
    marginBottom: 22,
  },
  note: {
    marginTop: 14,
    fontFamily: theme.fonts.medium,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.muted,
  },
});

export default styles;
