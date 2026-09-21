import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

// A SectionList has no per-group wrapper to hang gaps on, so what used to be
// three nested rowGaps is now: between days -> groupHeaderSpaced.marginTop,
// header to first row -> groupHeader.marginBottom, between rows -> itemSeparator.
const styles = StyleSheet.create({
  body: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: FAB_SCROLL_CLEARANCE,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  groupHeaderSpaced: {
    marginTop: theme.spacing.lg,
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
  itemSeparator: {
    height: theme.spacing.md,
  },
});

export default styles;
