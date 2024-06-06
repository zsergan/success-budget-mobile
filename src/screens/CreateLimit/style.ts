import { StyleSheet } from 'react-native';

import theme, { horizontalScreenPadding } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xl,
  },
  section: {
    rowGap: theme.spacing.md,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 34,
    left: horizontalScreenPadding,
    right: horizontalScreenPadding,
  },
  allOthersCategoriesButton: {
    justifyContent: 'center',
  },
});

export default styles;
