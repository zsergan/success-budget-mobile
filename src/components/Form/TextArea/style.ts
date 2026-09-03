import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  input: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.text,
    backgroundColor: colors.track,
    borderRadius: theme.radius.sm,
  },
});

export default styles;
