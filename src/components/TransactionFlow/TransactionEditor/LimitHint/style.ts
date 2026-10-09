import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

const styles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    minHeight: 28,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  // SemiBold under-measures its width in a content-sized text (see cde3346).
  text: {
    flexShrink: 1,
    paddingRight: 2,
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSizes.caption,
    lineHeight: theme.lineHeights.caption,
    color: colors.text,
  },
});

export default styles;
