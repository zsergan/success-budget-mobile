import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    row: {
      marginTop: scaleSpace(theme.spacing.sm, layout),
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: scaleSpace(theme.spacing.sm, layout),
    },
    chip: {
      maxWidth: '100%',
      minHeight: 34,
      borderRadius: 17,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    chipSet: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    chipBody: {
      flexShrink: 1,
      minHeight: 34,
      paddingLeft: scaleSpace(10, layout),
      paddingRight: scaleSpace(10, layout),
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(6, layout),
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    chipText: {
      flexShrink: 1,
      maxWidth: 180,
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      color: colors.text,
    },
    chipTextSet: {
      color: colors.onSecondary,
    },
    clear: {
      alignSelf: 'stretch',
      paddingRight: scaleSpace(12, layout),
      justifyContent: 'center',
    },
  });

export default createStyles;
