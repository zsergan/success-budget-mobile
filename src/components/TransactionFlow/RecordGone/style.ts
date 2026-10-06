import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: theme.spacing.md,
    backgroundColor: colors.track,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  title: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    textAlign: 'center',
    color: colors.text,
  },
  text: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    textAlign: 'center',
    color: colors.muted,
  },
  closeButton: {
    alignSelf: 'stretch',
    height: 52,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  closeButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    color: colors.text,
  },
});

export default styles;
