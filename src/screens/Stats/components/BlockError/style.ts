import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  card: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  title: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.label,
    color: colors.text,
    textAlign: 'center',
  },
  retryButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  retryText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.bodySm,
    color: colors.text,
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    paddingRight: 2,
  },
});

export default styles;
