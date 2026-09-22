import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    rowGap: theme.spacing.sm,
  },
  spaceLine: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
  },
  scrollContent: {
    rowGap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  errorText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: theme.spacing.md,
  },
});

export default styles;
