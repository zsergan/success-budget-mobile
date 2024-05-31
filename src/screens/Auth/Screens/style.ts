import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    rowGap: 32,
  },
  container: {
    width: '100%',
    rowGap: theme.spacing.lg,
  },
  rowInputs: {
    flexDirection: 'row',
    columnGap: theme.spacing.xl,
  },
  currency: {
    flex: 1,
    textAlign: 'center',
    height: '100%',
  },
  name: {
    flex: 2,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.secondary,
  },
});

export default styles;
