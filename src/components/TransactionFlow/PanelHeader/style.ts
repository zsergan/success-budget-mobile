import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    rowGap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.md,
  },
  title: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    color: colors.text,
  },
  subtitle: {
    marginTop: -theme.spacing.sm,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
});

export default styles;
