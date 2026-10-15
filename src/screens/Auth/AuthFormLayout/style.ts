import { StyleSheet } from 'react-native';

import theme, { colors } from '@shared/theme';

// Above the screen's bottom edge, as in the design's frame; it clears the home indicator's area on its own.
export const BOTTOM_GAP = 38;

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 26,
  },
  content: {
    flexGrow: 1,
    paddingTop: 10,
  },
  backRow: {
    flexDirection: 'row',
  },
  header: {
    marginTop: 26,
    rowGap: 9,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1.1,
    color: colors.text,
  },
  description: {
    fontFamily: theme.fonts.medium,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.muted,
  },
  body: {
    marginTop: 22,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  footer: {
    rowGap: 11,
  },
  prompt: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 6,
    rowGap: theme.spacing.xs,
  },
  promptText: {
    fontFamily: theme.fonts.medium,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.muted,
  },
});

export default styles;
