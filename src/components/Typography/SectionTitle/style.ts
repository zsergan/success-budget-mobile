import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSizes.sm,
    color: colors.text,
  },
});

export default styles;
