import { StyleSheet } from 'react-native';

import type { ColorTheme } from '@shared/theme';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme) =>
  StyleSheet.create({
    row: {
      marginTop: theme.spacing.sm,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
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
      paddingLeft: 10,
      paddingRight: 10,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 6,
    },
    // Plus Jakarta Sans under-measures its own width and clips the last glyph (see cde3346).
    chipText: {
      flexShrink: 1,
      maxWidth: 180,
      paddingRight: 2,
      fontFamily: theme.fonts.semiBold,
      fontSize: theme.fontSizes.bodySm,
      color: colors.text,
    },
    chipTextSet: {
      color: colors.onSecondary,
    },
    clear: {
      alignSelf: 'stretch',
      paddingRight: 12,
      justifyContent: 'center',
    },
  });

export default createStyles;
