import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    rowGap: theme.spacing.lg,
  },
  hero: {
    rowGap: 5,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
  },
  heroLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    letterSpacing: 0.3,
    color: colors.muted,
  },
  heroTotal: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.display,
    lineHeight: theme.lineHeights.display,
    letterSpacing: theme.letterSpacing.display,
    color: colors.text,
  },
  heroSub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  item: {
    marginVertical: 8,
    marginHorizontal: 8,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: theme.spacing.xxl,
    left: theme.spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    columnGap: theme.spacing.sm,
  },
  button: {
    flex: 1,
  },
});

export default styles;
