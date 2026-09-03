import { StyleSheet } from 'react-native';

import theme, { colors, shadowModal } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: theme.spacing.xl,
    bottom: theme.spacing.xxl,
    alignItems: 'flex-end',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    // Foundation's own accent-tinted FAB shadow — single use, not worth
    // a shared theme token alongside `shadow`/`shadowModal`.
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  menu: {
    rowGap: theme.spacing.sm,
    marginBottom: theme.spacing.md - 2,
    alignItems: 'flex-end',
  },
  menuItem: {
    height: 44,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: theme.spacing.sm + 1,
    backgroundColor: colors.elevated,
    ...shadowModal,
  },
  menuItemText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
  },
});

export default styles;
