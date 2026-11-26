import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { capRole, inset, scaleFont, scaleSpace } from '@shared/layout';
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
      paddingTop: scaleSpace(10, layout),
    },
    backRow: {
      flexDirection: 'row',
    },
    header: {
      marginTop: scaleSpace(26, layout),
      rowGap: scaleSpace(9, layout),
    },
    illustration: {
      width: 64,
      height: 64,
      borderRadius: 22,
      marginBottom: scaleSpace(8, layout),
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: theme.fonts.bold,
      fontSize: capRole('titleLg', scaleFont(30, layout), layout),
      lineHeight: capRole('titleLg', scaleFont(36, layout), layout),
      letterSpacing: -1.1,
      color: colors.text,
    },
    description: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(14.5, layout),
      lineHeight: scaleFont(22, layout),
      color: colors.muted,
    },
    body: {
      marginTop: scaleSpace(22, layout),
    },
    spacer: {
      flex: 1,
      minHeight: 20,
    },
    footer: {
      rowGap: scaleSpace(11, layout),
    },
    footerPinned: {
      paddingTop: scaleSpace(12, layout),
      paddingBottom: scaleSpace(12, layout),
      paddingHorizontal: inset(26, layout),
      backgroundColor: colors.bg,
    },
    prompt: {
      marginTop: 2,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(6, layout),
      rowGap: scaleSpace(theme.spacing.xs, layout),
    },
    promptText: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(13.5, layout),
      lineHeight: scaleFont(18, layout),
      color: colors.muted,
    },
  });

export default createStyles;
