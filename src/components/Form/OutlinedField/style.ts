import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      rowGap: scaleSpace(7, layout),
    },
    label: {
      fontFamily: theme.fonts.bold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(theme.lineHeights.caption, layout),
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.muted,
    },
    labelError: {
      color: colors.danger,
    },
    box: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(10, layout),
      paddingHorizontal: scaleSpace(14, layout),
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    boxFocused: {
      borderColor: colors.text,
    },
    boxError: {
      borderColor: colors.danger,
    },
    boxDisabled: {
      backgroundColor: colors.track,
    },
    value: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(15, layout),
      letterSpacing: -0.1,
      color: colors.text,
    },
    placeholder: {
      color: colors.placeholder,
    },
    error: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: scaleSpace(6, layout),
      paddingLeft: 2,
    },
    errorIcon: {
      marginTop: 2,
    },
    errorText: {
      flex: 1,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.danger,
    },
    hint: {
      paddingLeft: 2,
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      lineHeight: scaleFont(17, layout),
      color: colors.muted,
    },
  });

export default createStyles;
