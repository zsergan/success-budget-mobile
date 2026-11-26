import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, inset } from '@shared/layout';
import theme from '@shared/theme';

// Above the screen's bottom edge, as in the design's frame; it clears the home indicator's area on its own.
export const bottomGap = ({ isShort }: Pick<Layout, 'isShort'>) => (isShort ? theme.spacing.xxl : 38);

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: inset(26, layout),
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
    illustration: {
      width: 64,
      height: 64,
      borderRadius: 22,
      marginBottom: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.fonts.bold,
      fontSize: capRole('titleLg', 30, layout),
      lineHeight: capRole('titleLg', 36, layout),
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
    footerPinned: {
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: inset(26, layout),
      backgroundColor: colors.bg,
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

export default createStyles;
