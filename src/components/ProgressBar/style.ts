import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xs,
  },
  rootReverse: {
    flexDirection: 'column-reverse',
  },
  bar: {
    height: 5,
    width: '100%',
    borderRadius: theme.radius.sm,
    backgroundColor: colors.track,
  },
  progress: {
    height: 5,
    borderRadius: theme.radius.sm,
  },
  progressGreen: {
    backgroundColor: colors.ok,
  },
  progressYellow: {
    backgroundColor: colors.warn,
  },
  progressRed: {
    backgroundColor: colors.danger,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
});

export default styles;
