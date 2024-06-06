import { StyleSheet } from 'react-native';

import theme from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  amount: {
    marginBottom: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: theme.spacing.sm,
  },
  input: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.lg,
    color: theme.colors.text.primary,
  },
  container: {
    marginHorizontal: theme.spacing.xl,
    rowGap: theme.spacing.xl,
  },
  scrollWalletsContainer: {
    marginHorizontal: -theme.spacing.xl,
  },
  walletsContainer: {
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
  },
  section: {
    rowGap: theme.spacing.md,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
  },
});

export default styles;
