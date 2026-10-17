import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: theme.spacing.sm,
      borderRadius: theme.radius.md,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.md,
    },
    textColumn: {
      flex: 1,
      rowGap: 2,
    },
    title: {
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      lineHeight: theme.lineHeights.bodySm,
      color: colors.text,
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
    action: {
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: 4,
    },
    // SemiBold under-measures its width in a content-sized label (see cde3346).
    actionText: {
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
      textDecorationLine: 'underline',
    },
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      columnGap: 11,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
    },
    cardIcon: {
      marginTop: 1,
    },
    cardTextColumn: {
      flex: 1,
      rowGap: theme.spacing.xs,
    },
    cardTitle: {
      fontFamily: theme.fonts.bold,
      fontSize: 13.5,
      lineHeight: 18,
      letterSpacing: -0.1,
    },
    cardText: {
      fontFamily: theme.fonts.medium,
      fontSize: 12.5,
      lineHeight: 18,
    },
    cardAction: {
      marginTop: 6,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
      minWidth: 44,
      height: 32,
      paddingHorizontal: 13,
      justifyContent: 'center',
      borderRadius: 11,
      borderWidth: 1,
      backgroundColor: colors.elevated,
    },
    // Bold under-measures its width in a content-sized label (see cde3346).
    cardActionText: {
      paddingRight: 2,
      fontFamily: theme.fonts.bold,
      fontSize: theme.fontSizes.caption,
      lineHeight: theme.lineHeights.caption,
      color: colors.text,
    },
  });

export default createStyles;
