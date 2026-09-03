import { StyleSheet } from 'react-native';

import theme, { horizontalScreenPadding, colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    paddingHorizontal: horizontalScreenPadding,
    backgroundColor: colors.secondary,
  },
  container: {
    flexDirection: 'row',
    columnGap: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    maxWidth: '80%',
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.sm,
    color: colors.onSecondary,
  },
});

export default styles;
