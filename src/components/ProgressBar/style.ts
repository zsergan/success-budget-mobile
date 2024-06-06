import { StyleSheet } from 'react-native';

import theme, { palette } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    rowGap: theme.spacing.xs,
  },
  rootReverse: {
    flexDirection: 'column-reverse',
  },
  bar: {
    height: 10,
    width: '100%',
    borderRadius: theme.radius.sm,
    backgroundColor: palette.grey,
  },
  progress: {
    height: 10,
    borderRadius: theme.radius.sm,
  },
  progressGreen: {
    backgroundColor: palette.greenDark,
  },
  progressYellow: {
    backgroundColor: palette.yellow,
  },
  progressRed: {
    backgroundColor: palette.red,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.xs,
    color: theme.colors.text.primary,
  },
});

export default styles;
