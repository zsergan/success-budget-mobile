import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  confirmContainer: {
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  confirmText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
  longPressedItem: {
    width: '100%',
  },
  carouselContainer: {
    position: 'relative',
  },
  fadeLeft: {
    position: 'absolute',
    left: -theme.spacing.xl,
    top: 0,
    bottom: 0,
    width: 26,
  },
  fadeRight: {
    position: 'absolute',
    right: -theme.spacing.xl,
    top: 0,
    bottom: 0,
    width: 34,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 5,
    marginTop: theme.spacing.md + 2,
  },
  dot: {
    height: 5,
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.accent,
  },
});

export default styles;
