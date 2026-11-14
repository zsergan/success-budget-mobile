import type { TextStyle } from 'react-native';

import type { ThemeColors } from '@shared/theme';
import theme from '@shared/theme';

// The small capital label over each group of the form.
export const sectionLabel = (colors: ThemeColors): TextStyle => ({
  fontFamily: theme.fonts.bold,
  fontSize: theme.fontSizes.micro,
  lineHeight: theme.lineHeights.micro,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  color: colors.muted,
});

// A line of explanation under a group, beside an info mark.
export const sectionNote = (colors: ThemeColors): TextStyle => ({
  flex: 1,
  fontFamily: theme.fonts.medium,
  fontSize: theme.fontSizes.caption,
  lineHeight: 17,
  color: colors.muted,
});
