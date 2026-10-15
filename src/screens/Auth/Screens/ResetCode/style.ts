import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  failure: {
    marginTop: -2,
    marginBottom: 22,
  },
  note: {
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: theme.fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.muted,
  },
});

export default styles;
