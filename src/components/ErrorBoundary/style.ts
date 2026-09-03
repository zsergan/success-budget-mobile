import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: colors.bg,
  },
  message: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.md,
    color: colors.muted,
    textAlign: 'center',
  },
  button: {
    width: '60%',
  },
});

export default styles;
