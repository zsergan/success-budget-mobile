import { StyleSheet } from 'react-native';

import theme, { palette, shadow } from '@shared/theme';

const styles = StyleSheet.create({
  options: {
    marginTop: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    backgroundColor: palette.grey,
    borderRadius: theme.radius.sm,
    alignSelf: 'flex-end',
    ...shadow,
  },
  option: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    columnGap: theme.spacing.xxl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSizes.sm,
    color: theme.colors.text.primary,
  },
  divider: {
    height: 0.5,
    backgroundColor: palette.greyDark,
  },
});

export default styles;
