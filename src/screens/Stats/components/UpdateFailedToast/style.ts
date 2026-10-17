import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

// The toast's height and its offset, plus a gap: how far the list must scroll past its last row to clear it.
export const UPDATE_TOAST_SPACE = 96;

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      bottom: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.elevated,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
      elevation: 8,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(colors.danger, 0.12),
    },
    text: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: 13.5,
      lineHeight: 18,
      color: colors.text,
    },
    retry: {
      height: 44,
      paddingHorizontal: 10,
      justifyContent: 'center',
    },
    retryText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 12.5,
      color: colors.danger,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
  });

export default createStyles;
