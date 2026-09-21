import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  emptyBlock: {
    marginTop: theme.spacing.lg,
    rowGap: theme.spacing.lg,
  },
  rules: {
    rowGap: theme.spacing.sm + 1,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: theme.spacing.sm,
  },
  ruleText: {
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
});

export default styles;
