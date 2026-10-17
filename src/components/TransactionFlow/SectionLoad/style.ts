import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      minHeight: 52,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: theme.spacing.md,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.hairline,
    },
    text: {
      flexShrink: 1,
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.muted,
    },
    retryButton: {
      height: 32,
      borderRadius: 10,
      paddingHorizontal: theme.spacing.md,
      justifyContent: 'center',
      backgroundColor: colors.track,
    },
    // SemiBold under-measures its width in a content-sized chip (see cde3346).
    retryText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
  });

export default createStyles;
