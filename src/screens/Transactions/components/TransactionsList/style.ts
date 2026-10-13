import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';
import { FAB_SCROLL_CLEARANCE } from '@shared/constants';

// SectionList has no group wrapper for gaps: days use groupHeaderSpaced.marginTop,
// header to row groupHeader.marginBottom, rows itemSeparator.
const styles = StyleSheet.create({
  body: {
    flex: 1,
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
  groupHeaderFirst: {
    marginTop: theme.spacing.md,
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
  footer: {
    marginTop: theme.spacing.lg,
  },
  itemSeparator: {
    height: theme.spacing.md,
  },
});

export default styles;
