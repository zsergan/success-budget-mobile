import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    rowGap: theme.spacing.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  textContainer: {
    // stretch so title/description's own width: '100%' resolves against a real width, not an ambiguous shrink-wrap parent.
    alignSelf: 'stretch',
    alignItems: 'center',
    rowGap: theme.spacing.xs + 2,
  },
  title: {
    // Plus Jakarta Sans under-measures; see cde3346.
    width: '100%',
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    color: colors.text,
  },
  description: {
    // Without width: '100%' this can silently fail to wrap and overflow the screen instead.
    width: '100%',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.muted,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
  },
  solidRoot: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.hairline,
  },
  secondaryActionBorder: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});

export default styles;
