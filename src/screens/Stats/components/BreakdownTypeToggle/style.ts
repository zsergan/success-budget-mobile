import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    height: 40,
    borderRadius: theme.radius.md,
    padding: 4,
    flexDirection: 'row',
    columnGap: 4,
    backgroundColor: colors.track,
  },
  tab: {
    flex: 1,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
  },
  tabActive: {
    backgroundColor: colors.elevated,
    shadowColor: colors.text,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  label: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    lineHeight: theme.lineHeights.bodySm,
    color: colors.muted,
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    paddingRight: 2,
  },
  labelActive: {
    color: colors.text,
  },
});

export default styles;
