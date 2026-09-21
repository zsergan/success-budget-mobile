import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  themeRow: {
    rowGap: theme.spacing.md - 1,
    padding: theme.spacing.md + 2,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    rowGap: 3,
  },
  rowLabel: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
  },
  rowSub: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.muted,
  },
  themeSwitch: {
    height: 44,
    borderRadius: 15,
    padding: 4,
    flexDirection: 'row',
    columnGap: 4,
    backgroundColor: colors.track,
  },
  themeTab: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTabActive: {
    backgroundColor: colors.elevated,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  themeTabText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.muted,
  },
  themeTabTextActive: {
    color: colors.text,
  },
});

export default styles;
