import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  resetPasswordButton: {
    paddingBottom: 40,
    alignSelf: 'flex-end',
  },
  inputsContainer: {
    width: '100%',
    rowGap: theme.spacing.lg,
  },
  buttonsContainer: {
    width: '100%',
  },
  infoText: {
    transform: [{ translateY: -theme.spacing.sm }],
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    paddingHorizontal: theme.spacing.lg,
  },
  pb40: {
    paddingBottom: 40,
  },
});

export default styles;
