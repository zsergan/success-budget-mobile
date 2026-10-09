import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  header: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    // The height the search button gave the header, so the list below stays where it was.
    minHeight: 36 + theme.spacing.md * 2,
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.titleLg,
    lineHeight: theme.lineHeights.titleLg,
    letterSpacing: theme.letterSpacing.titleLg,
    color: colors.text,
  },
});

export default styles;
