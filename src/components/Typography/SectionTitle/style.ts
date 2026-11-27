import { StyleSheet } from 'react-native';

import type { Layout } from '@shared/layout';
import type { ColorTheme } from '@shared/theme';
import { scaleFont, scaleSpace, textRole } from '@shared/layout';
import theme from '@shared/theme';

const createStyles = ({ colors }: ColorTheme, layout: Layout) =>
  StyleSheet.create({
    root: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleContainer: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 0,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: scaleSpace(theme.spacing.sm, layout),
    },
    title: {
      // Plus Jakarta Sans under-measures; see cde3346.
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      fontFamily: theme.fonts.semiBold,
      fontSize: scaleFont(theme.fontSizes.label, layout),
      lineHeight: scaleFont(theme.lineHeights.label, layout),
      color: colors.text,
    },
    titleColumn: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      rowGap: 2,
    },
    subtitle: {
      fontFamily: theme.fonts.medium,
      fontSize: scaleFont(theme.fontSizes.bodySm, layout),
      lineHeight: scaleFont(theme.lineHeights.bodySm, layout),
      color: colors.muted,
    },
    headerTitle: {
      ...textRole('titleSm', layout),
      letterSpacing: theme.letterSpacing.titleSm,
    },
  });

export default createStyles;
