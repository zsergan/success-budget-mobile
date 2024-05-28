import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  blocksContainer: {
    rowGap: theme.spacing.xl,
  },
  formContainer: {
    rowGap: theme.spacing.lg,
  },
  rowInputs: {
    flexDirection: 'row',
    columnGap: theme.spacing.xl,
  },
  currency: {
    flex: 1,
    textAlign: 'center',
  },
  balance: {
    flex: 2,
  },
  designsContainer: {
    flexDirection: 'row',
    columnGap: theme.spacing.md,
  },
  designCircle: {
    width: 60,
    height: 60,
    borderRadius: 60,
  },
  selectedCircle: {
    borderWidth: 2,
    borderColor: palette.black,
  },
  gradient: {
    borderRadius: 60,
  },
});

export default styles;
