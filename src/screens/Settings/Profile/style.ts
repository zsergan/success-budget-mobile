import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    rowGap: theme.spacing.sm,
  },
  profile: {
    alignItems: 'center',
  },
  name: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    color: colors.text,
  },
  email: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
});

export default styles;
