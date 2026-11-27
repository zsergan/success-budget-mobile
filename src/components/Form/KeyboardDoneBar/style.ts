import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, screenPadding } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors, elevation }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: screenPadding(layout),
      paddingVertical: scaleSpace(theme.spacing.sm, layout),
    },
    button: {
      minHeight: 32,
      paddingVertical: scaleSpace(theme.spacing.xs + 2, layout),
      paddingHorizontal: scaleSpace(theme.spacing.lg, layout),
      borderRadius: theme.radius.sm,
      justifyContent: 'center',
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.hairline,
      ...elevation.segment,
    },
    label: {
      // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
  });

export default createStyles;
