import { StyleSheet } from 'react-native';

import theme, { colors, shadowModal } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    // left/right: 0 + paddingRight (rather than just `right: xl`) so this
    // has a deterministic full-width box, instead of Yoga's shrink-wrap
    // sizing for an absolutely-positioned node with only `right` set
    // (which measured this to the 58px FAB alone, not the wider menu
    // pills — harmless visually since RN just lets the pills overflow
    // it, but not worth relying on). `pointerEvents="box-none"` on the
    // root View (Fab.tsx) keeps this now-full-width box from swallowing
    // touches on whatever sits behind its mostly-transparent area.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.spacing.xxl,
    alignItems: 'flex-end',
    paddingRight: theme.spacing.xl,
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
    // paddingRight buffer: same Plus Jakarta Sans SemiBold under-measurement
    // as TinyButton's smTitle/mdTitle (see cde3346) — this box auto-sizes
    // to its content (a pill, not stretched to fill anything wider), so
    // give the glyphs a little extra room directly rather than relying on
    // a wider parent box.
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    lineHeight: theme.lineHeights.label,
    color: colors.text,
  },
});

export default styles;
