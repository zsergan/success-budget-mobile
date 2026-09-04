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
    // alignSelf: 'stretch' so this takes root's full content width instead
    // of shrink-wrapping — otherwise title/description's own width: '100%'
    // resolves against an ambiguous parent and can clip the last glyph.
    alignSelf: 'stretch',
    alignItems: 'center',
    rowGap: theme.spacing.xs + 2,
  },
  title: {
    // width: '100%' + textAlign because a Text sized by intrinsic content
    // width inside an alignItems:'center' column can get a layout box
    // narrower than Plus Jakarta Sans actually needs to paint, clipping
    // the last glyph (see commit cde3346, same class of bug).
    width: '100%',
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleSm,
    lineHeight: theme.lineHeights.titleSm,
    letterSpacing: theme.letterSpacing.titleSm,
    color: colors.text,
  },
  description: {
    // width: '100%' because a Text inside an alignItems:'center' column
    // can silently fail to wrap and overflow the screen instead —
    // hit this exact bug with ErrorBoundary.message in design stage 4.
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
