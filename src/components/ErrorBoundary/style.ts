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
    width: '100%',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    color: colors.muted,
    textAlign: 'center',
  },
  button: {
    width: '60%',
  },
});

export default styles;
