import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  walletsTitle: {
    marginTop: 26,
  },
  walletsSection: {
    marginTop: 14,
  },
  activityTitle: {
    marginTop: 26,
  },
  activitySection: {
    marginTop: 8,
  },
  activity: {
    rowGap: theme.spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  groupLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  groupTotal: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  groupItems: {
    rowGap: theme.spacing.sm,
  },
  item: {
    marginVertical: 8,
    marginHorizontal: 8,
  },
});

export default styles;
