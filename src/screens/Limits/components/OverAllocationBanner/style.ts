import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';
import { hexToRgba } from '@shared/utils';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      borderRadius: theme.radius.md + 2,
      padding: scaleSpace(theme.spacing.md, layout) + 1,
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout) + 1,
      backgroundColor: hexToRgba(colors.warn, 0.12),
      borderWidth: 1,
      borderColor: hexToRgba(colors.warn, 0.3),
    },
    iconBox: {
      marginTop: 1,
    },
    content: {
      flex: 1,
      rowGap: scaleSpace(theme.spacing.sm, layout) - 1,
    },
    text: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      columnGap: scaleSpace(theme.spacing.sm, layout) - 2,
    },
    raiseButton: {
      minHeight: 30,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) - 2,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    raiseButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.text,
    },
    keepButton: {
      minHeight: 30,
      paddingHorizontal: scaleSpace(theme.spacing.md, layout) - 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keepButtonText: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.caption, layout),
      color: colors.muted,
    },
  });

export default createStyles;
