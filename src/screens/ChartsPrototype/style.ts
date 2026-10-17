import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme, { horizontalScreenPadding } from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flexGrow: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: horizontalScreenPadding,
      paddingBottom: 40,
      gap: 12,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.titleMd,
      lineHeight: theme.lineHeights.titleMd,
      color: colors.text,
      marginTop: 12,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      height: 30,
      paddingHorizontal: 11,
      borderRadius: 10,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    chipActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    chipText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: 11,
      lineHeight: 14,
      color: colors.muted,
    },
    chipTextActive: {
      color: colors.onSecondary,
    },
    card: {
      borderRadius: 18,
      paddingTop: 14,
      paddingHorizontal: 14,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
  });

export default createStyles;
