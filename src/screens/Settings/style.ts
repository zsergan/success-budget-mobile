import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    rowGap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  confirmText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodyLg,
    lineHeight: theme.lineHeights.bodyLg,
    textAlign: 'center',
    color: colors.text,
  },
  confirmSubtext: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    textAlign: 'center',
    color: colors.muted,
  },
});

export default styles;
