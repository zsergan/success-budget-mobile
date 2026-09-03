import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sectionsContainer: {
    rowGap: theme.spacing.xl,
  },
  section: {
    rowGap: theme.spacing.md,
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
    columnGap: 14,
  },
  designCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircle: {
    borderColor: colors.accent,
  },
  gradient: {
    borderRadius: 15,
  },
});

export default styles;
