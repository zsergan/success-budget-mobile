import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  scopeSwitch: {
    marginHorizontal: theme.spacing.xl,
    height: 46,
    borderRadius: 15,
    padding: 4,
    flexDirection: 'row',
    columnGap: 4,
    backgroundColor: colors.track,
  },
  scopeTab: {
    flex: 1,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeTabActive: {
    backgroundColor: colors.elevated,
    shadowColor: colors.text,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  scopeTabText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    color: colors.muted,
  },
  scopeTabTextActive: {
    color: colors.text,
  },
});

export default styles;
