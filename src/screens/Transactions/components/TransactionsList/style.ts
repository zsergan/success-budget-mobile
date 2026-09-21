import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

const styles = StyleSheet.create({
  body: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: FAB_SCROLL_CLEARANCE,
    rowGap: theme.spacing.lg,
  },
  group: {
    rowGap: theme.spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
    letterSpacing: theme.letterSpacing.micro,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  groupTotal: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.micro,
    lineHeight: theme.lineHeights.micro,
    color: colors.muted,
  },
  groupTotalPositive: {
    color: colors.ok,
  },
  groupItems: {
    rowGap: theme.spacing.md,
  },
});

export default styles;
