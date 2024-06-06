import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    rowGap: theme.spacing.xl,
    width: 110,
  },
  grey: {
    backgroundColor: palette.grey,
  },
  gradient: {
    borderRadius: theme.radius.sm,
  },
  walletName: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: palette.black,
  },
  currencyCode: {
    fontFamily: theme.fonts.medium,
    fontSize: 8,
    color: palette.black,
    alignSelf: 'flex-end',
  },
});

export default styles;
