import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      minHeight: 40,
      borderRadius: theme.radius.md,
      padding: scaleSpace(4, layout),
      flexDirection: 'row',
      columnGap: scaleSpace(4, layout),
      backgroundColor: colors.track,
    },
    tab: {
      flex: 1,
      borderRadius: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      columnGap: scaleSpace(6, layout),
    },
    tabActive: {
      backgroundColor: colors.elevated,
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
    },
    label: {
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
    },
    labelActive: {
      color: colors.text,
    },
  });

export default createStyles;
